import { useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "react-router-dom"
import FullCalendar from "@fullcalendar/react"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import dayGridPlugin from "@fullcalendar/daygrid"
import type { DateSelectArg, EventClickArg } from "@fullcalendar/core"

import { Modal, Toast } from "bootstrap"
import { useAuth } from "../auth/useAuth"

type ApiEvent = {
    _id: string
    title: string
    description?: string
    start: string
    end: string
    user: { _id: string; username: string } // Modifié ici
    color?: string
}

type CalendarEvent = {
    id: string
    title: string
    start: string
    end: string
    backgroundColor?: string
    borderColor?: string
    extendedProps: {
        description?: string
        userId?: string
        color?: string
    }
}


type EventForm = {
    title: string
    description: string
    start: string
    end: string
    color: string
}

type CalendarView = "dayGridMonth" | "timeGridWeek" | "timeGridDay"

function toDatetimeLocalValue(date: Date) {
    const pad = (n: number) => String(n).padStart(2, "0")
    const yyyy = date.getFullYear()
    const mm = pad(date.getMonth() + 1)
    const dd = pad(date.getDate())
    const hh = pad(date.getHours())
    const mi = pad(date.getMinutes())
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
}

function isValidDate(d: Date) {
    return !Number.isNaN(d.getTime())
}

function Agenda() {
    const { user, token } = useAuth()

    const params = useParams()
    const agendaUserId = params.id || user?.userId || ""
    const isMyAgenda = agendaUserId === user?.userId

    const [targetUsername, setTargetUsername] = useState<string>("");

    // Utilisez la variable d'environnement en production, et localhost en développement
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";


    // =========================
    // STATE CALENDAR
    // =========================
    const [events, setEvents] = useState<CalendarEvent[]>([])
    const [loading, setLoading] = useState(true)
    const [view, setView] = useState<CalendarView>("dayGridMonth")

    const calendarRef = useRef<FullCalendar | null>(null)
    // =========================
    // MODALS
    // =========================
    const createModalRef = useRef<HTMLDivElement>(null)
    const editModalRef = useRef<HTMLDivElement>(null)
    const confirmDeleteModalRef = useRef<HTMLDivElement>(null)

    // =========================
    // TOAST
    // =========================
    const toastRef = useRef<HTMLDivElement>(null)

    const showToast = (message: string, success = true) => {
        if (!toastRef.current) return

        toastRef.current.className = `toast ${success ? "text-bg-success" : "text-bg-danger"
            }`

        const body = toastRef.current.querySelector(".toast-body")
        if (body) body.textContent = message

        new Toast(toastRef.current).show()
    }

    // =========================
    // FORM CREATE
    // =========================
    const [eventForm, setEventForm] = useState<EventForm>({
        title: "",
        description: "",
        start: "",
        end: "",
        color: "#0d6efd"

    })
    const [formError, setFormError] = useState("")

    // =========================
    // FORM EDIT
    // =========================
    const [editForm, setEditForm] = useState<EventForm>({
        title: "",
        description: "",
        start: "",
        end: "",
        color: "#0d6efd"

    })
    const [editError, setEditError] = useState("")
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

    // =========================
    // DELETE
    // =========================
    const [deleteEventId, setDeleteEventId] = useState<string | null>(null)

    // =========================
    // CHANGE VIEW
    // =========================
    useEffect(() => {
        const api = calendarRef.current?.getApi()
        if (!api) return
        api.changeView(view)
    }, [view])

    // =========================
    // LOAD EVENTS (API)
    // =========================


    useEffect(() => {
        const loadEvents = async () => {
            if (!agendaUserId) return;

            if (isMyAgenda && !token) return;

            setLoading(true);
            try {
                const url = isMyAgenda
                    ? `${API_URL}/events/me`
                    : `${API_URL}/events/user/${agendaUserId}`;

                const res = await fetch(url, {
                    headers: {
                        // Only add Authorization if token exists
                        ...(token ? { Authorization: `Bearer ${token}` } : {})
                    },
                });

                if (!res.ok) throw new Error("Erreur");

                const data = await res.json() as ApiEvent[];

                const mapped: CalendarEvent[] = data.map((e) => ({
                    id: e._id,
                    title: e.title,
                    start: e.start,
                    end: e.end,
                    backgroundColor: e.color || "#0d6efd",
                    borderColor: e.color || "#0d6efd",
                    extendedProps: {
                        description: e.description,
                        userId: typeof e.user === 'object' ? e.user._id : e.user,
                        color: e.color
                    },
                }));

                setEvents(mapped);

                if (!isMyAgenda) {
                    if (data.length > 0) {
                        setTargetUsername(data[0].user.username);
                    } else {
                        setTargetUsername("Utilisateur (vide)");
                    }
                }
            } catch {
                showToast("Impossible de charger l'agenda public ❌", false);
            } finally {
                setLoading(false);
            }
        };

        loadEvents();
    }, [token, agendaUserId, isMyAgenda]);




    // =========================
    // SELECT RANGE -> CREATE MODAL
    // =========================
    const handleSelect = (info: DateSelectArg) => {
        if (!isMyAgenda) {
            showToast("Action interdite : agenda en lecture seule ❌", false)
            return // Empêche l'ouverture du modal de création
        }
        const start = info.start
        const end = info.end

        setEventForm({
            title: "",
            description: "",
            start: toDatetimeLocalValue(start),
            end: toDatetimeLocalValue(end),
            color: "#0d6efd", // valeur par défaut
        })

        setFormError("")

        if (createModalRef.current) {
            new Modal(createModalRef.current).show()
        }
    }

    // =========================
    // CREATE EVENT
    // =========================
    const submitCreateEvent = async () => {

        if (!token) return

        setFormError("")

        const title = eventForm.title.trim()
        const description = eventForm.description.trim()

        if (!title) {
            setFormError("Le titre est obligatoire.")
            return
        }

        const startDate = new Date(eventForm.start)
        const endDate = new Date(eventForm.end)

        if (!isValidDate(startDate) || !isValidDate(endDate)) {
            setFormError("Dates invalides.")
            return
        }

        if (endDate <= startDate) {
            setFormError("La date de fin doit être supérieure à la date de début.")
            return
        }

        try {
            const res = await fetch(`${API_URL}/events`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title,
                    description,
                    start: startDate.toISOString(),
                    end: endDate.toISOString(),
                    color: eventForm.color
                }),
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.message || "Erreur création event")

            const created = data as ApiEvent

            setEvents((prev) => [
                ...prev,
                {
                    id: created._id,
                    title: created.title,
                    start: created.start,
                    end: created.end,
                    backgroundColor: created.color,
                    borderColor: created.color,
                    extendedProps: {
                        description: created.description,
                        userId: user?.userId,
                        color: created.color
                    },
                },
            ])

            showToast("Événement ajouté avec succès ✅", true)

            if (createModalRef.current) {
                Modal.getInstance(createModalRef.current)?.hide()
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                showToast(err.message || "Erreur lors de l’ajout ❌", false)
            } else {
                showToast("Erreur lors de l’ajout ❌", false)
            }
        }
    }

    // =========================
    // CLICK EVENT -> OPEN EDIT MODAL
    // =========================
    const [readOnlyEvent, setReadOnlyEvent] = useState<EventForm | null>(null)
    const readModalRef = useRef<HTMLDivElement>(null)

    const handleEventClick = (clickInfo: EventClickArg) => {
        const ev = clickInfo.event

        const ownerId = (ev.extendedProps as { userId?: string }).userId || ""
        const canEdit = ownerId === user?.userId

        const start = ev.start ? toDatetimeLocalValue(ev.start) : ""
        const end = ev.end ? toDatetimeLocalValue(ev.end) : start

        if (!canEdit) {
            setReadOnlyEvent({
                title: ev.title || "",
                description: (ev.extendedProps.description as string) || "",
                start,
                end,
                color: (ev.extendedProps.color as string) || "#0d6efd",
            })

            if (readModalRef.current) {
                new Modal(readModalRef.current).show()
            }
            return
        }

        // propriétaire → édition
        setSelectedEventId(ev.id)

        setEditForm({
            title: ev.title || "",
            description: (ev.extendedProps.description as string) || "",
            start,
            end,
            color: (ev.extendedProps.color as string) || "#0d6efd",
        })

        setEditError("")

        if (editModalRef.current) {
            new Modal(editModalRef.current).show()
        }
    }


    // =========================
    // UPDATE EVENT
    // =========================
    const submitEditEvent = async () => {
        if (!token) return
        if (!selectedEventId) return

        setEditError("")

        const title = editForm.title.trim()
        const description = editForm.description.trim()

        if (!title) {
            setEditError("Le titre est obligatoire.")
            return
        }

        const startDate = new Date(editForm.start)
        const endDate = new Date(editForm.end)

        if (!isValidDate(startDate) || !isValidDate(endDate)) {
            setEditError("Dates invalides.")
            return
        }

        if (endDate <= startDate) {
            setEditError("La date de fin doit être supérieure à la date de début.")
            return
        }

        try {
            const res = await fetch(`${API_URL}/events/${selectedEventId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title,
                    description,
                    start: startDate.toISOString(),
                    end: endDate.toISOString(),
                    color: editForm.color
                }),
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.message || "Erreur update event")

            const updated = data as ApiEvent

            // 🔥 update UI sans reload
            setEvents((prev) =>
                prev.map((e) =>
                    e.id === updated._id
                        ? {
                            ...e,
                            title: updated.title,
                            start: updated.start,
                            end: updated.end,
                            backgroundColor: updated.color,
                            borderColor: updated.color,
                            extendedProps: {
                                ...e.extendedProps, // 👈 Garde les anciennes propriétés (comme userId)
                                description: updated.description,
                                color: updated.color
                            },
                        }
                        : e,
                ),
            )

            showToast("Événement modifié avec succès ✅", true)

            if (editModalRef.current) {
                Modal.getInstance(editModalRef.current)?.hide()
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                showToast(err.message || "Erreur modification ❌", false)
            } else {
                showToast("Erreur modification ❌", false)
            }
        }
    }

    // =========================
    // ASK DELETE (OPEN CONFIRM MODAL)
    // =========================
    const askDeleteEvent = () => {
        if (!selectedEventId) return

        setDeleteEventId(selectedEventId)

        if (editModalRef.current) {
            Modal.getInstance(editModalRef.current)?.hide()
        }

        if (confirmDeleteModalRef.current) {
            new Modal(confirmDeleteModalRef.current).show()
        }
    }

    // =========================
    // CONFIRM DELETE
    // =========================
    const confirmDeleteEvent = async () => {
        if (!token) return
        if (!deleteEventId) return

        try {
            const res = await fetch(`${API_URL}/events/${deleteEventId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            const data = await res.json().catch(() => null)

            if (!res.ok) {
                throw new Error(data?.message || "Erreur suppression event")
            }

            // 🔥 update UI sans reload
            setEvents((prev) => prev.filter((e) => e.id !== deleteEventId))

            showToast("Événement supprimé ✅", true)

            if (confirmDeleteModalRef.current) {
                Modal.getInstance(confirmDeleteModalRef.current)?.hide()
            }

            setDeleteEventId(null)
            setSelectedEventId(null)
        } catch (err: unknown) {
            if (err instanceof Error) {
                showToast(err.message || "Erreur suppression ❌", false)
            } else {
                showToast("Erreur suppression ❌", false)
            }
        }
    }

    // =========================
    // OPTIONS
    // =========================
    const calendarHeight = useMemo(() => 720, [])

    return (
        <div className="container py-4">
            {/* ================= TOAST ================= */}
            <div
                className="toast-container position-fixed top-0 end-0 p-3"
                style={{ zIndex: 1080 }}
            >
                <div ref={toastRef} className="toast" role="alert">
                    <div className="toast-body">...</div>
                </div>
            </div>

            {/* ================= HEADER ================= */}
            <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-3">
                <div>
                    <div>
                        {isMyAgenda ? (
                            <>
                                <h2 className="mb-1">Mon Agenda</h2>
                                <div className="text-muted">
                                    Connecté en tant que <strong>@{user?.username}</strong>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 className="mb-1">Agenda de {targetUsername || "Chargement..."}</h2>
                                <div className="badge bg-info text-dark">Mode Lecture Seule</div>
                            </>
                        )}
                    </div>

                </div>

                <div className="d-flex align-items-center gap-3">
                    <span className="badge text-bg-light border">
                        Events : {events.length}
                    </span>

                    <div className="d-flex align-items-center gap-2">
                        <label className="text-muted small">Vue :</label>

                        <select
                            className="form-select"
                            style={{ width: 180 }}
                            value={view}
                            onChange={(e) => setView(e.target.value as CalendarView)}
                        >
                            <option value="dayGridMonth">Mois</option>
                            <option value="timeGridWeek">Semaine (24h)</option>
                            <option value="timeGridDay">Jour (24h)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* ================= CALENDAR ================= */}
            <div className="card shadow-sm">
                <div className="card-body">
                    {loading ? (
                        <div className="text-center py-5">Chargement...</div>
                    ) : (
                        <FullCalendar
                            ref={calendarRef}
                            plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
                            initialView={view}
                            height={calendarHeight}
                            locale="fr"
                            nowIndicator={true}
                            editable={false}
                            selectable={isMyAgenda}
                            select={isMyAgenda ? handleSelect : undefined}
                            selectMirror={true}
                            allDaySlot={false}
                            slotMinTime="00:00:00"
                            slotMaxTime="24:00:00"
                            slotDuration="00:30:00"
                            events={events}
                            eventClick={handleEventClick}
                        />
                    )}
                </div>
            </div>

            {/* ================= MODAL CREATE EVENT ================= */}
            <div ref={createModalRef} className="modal fade" tabIndex={-1}>
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">
                                <i className="fa fa-calendar-plus-o me-2"></i>
                                Ajouter un événement
                            </h5>
                            <button className="btn-close" data-bs-dismiss="modal"></button>
                        </div>

                        <div className="modal-body">
                            {formError && (
                                <div className="alert alert-danger">{formError}</div>
                            )}

                            <label className="form-label">Titre</label>
                            <input
                                className="form-control mb-3"
                                value={eventForm.title}
                                onChange={(e) =>
                                    setEventForm((p) => ({ ...p, title: e.target.value }))
                                }
                            />

                            <label className="form-label">Description</label>
                            <textarea
                                className="form-control mb-3"
                                rows={3}
                                value={eventForm.description}
                                onChange={(e) =>
                                    setEventForm((p) => ({ ...p, description: e.target.value }))
                                }
                            />
                            <label className="form-label">Couleur</label>

                            <div className="d-flex gap-2 mb-3">
                                {[
                                    "#0d6efd",
                                    "#198754",
                                    "#dc3545",
                                    "#ffc107",
                                    "#6f42c1",
                                    "#fd7e14",
                                ].map((color) => (
                                    <div
                                        key={color}
                                        onClick={() =>
                                            setEventForm((p) => ({ ...p, color }))
                                        }
                                        style={{
                                            width: "28px",
                                            height: "28px",
                                            backgroundColor: color,
                                            borderRadius: "6px",
                                            cursor: "pointer",

                                            border:
                                                eventForm.color === color
                                                    ? "3px solid white"
                                                    : "2px solid transparent",
                                            boxShadow:
                                                eventForm.color === color
                                                    ? "0 0 0 2px #000"
                                                    : "0 0 0 1px #ddd",
                                            transition: "all 0.2s ease",
                                        }}
                                    />
                                ))}
                            </div>

                            <input
                                type="hidden"
                                value={eventForm.color}
                                readOnly
                            />

                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label">Début</label>
                                    <input
                                        type="datetime-local"
                                        className="form-control"
                                        value={eventForm.start}
                                        onChange={(e) =>
                                            setEventForm((p) => ({ ...p, start: e.target.value }))
                                        }
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label">Fin</label>
                                    <input
                                        type="datetime-local"
                                        className="form-control"
                                        value={eventForm.end}
                                        onChange={(e) =>
                                            setEventForm((p) => ({ ...p, end: e.target.value }))
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-light border" data-bs-dismiss="modal">
                                Annuler
                            </button>

                            <button className="btn btn-primary" onClick={submitCreateEvent}>
                                Enregistrer
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ================= MODAL EDIT EVENT ================= */}
            <div ref={editModalRef} className="modal fade" tabIndex={-1}>
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">
                                <i className="fa fa-pencil me-2"></i>
                                Modifier l’événement
                            </h5>
                            <button className="btn-close" data-bs-dismiss="modal"></button>
                        </div>

                        <div className="modal-body">
                            {editError && (
                                <div className="alert alert-danger">{editError}</div>
                            )}

                            <label className="form-label">Titre</label>
                            <input
                                className="form-control mb-3"
                                value={editForm.title}
                                onChange={(e) =>
                                    setEditForm((p) => ({ ...p, title: e.target.value }))
                                }
                            />

                            <label className="form-label">Description</label>
                            <textarea
                                className="form-control mb-3"
                                rows={3}
                                value={editForm.description}
                                onChange={(e) =>
                                    setEditForm((p) => ({ ...p, description: e.target.value }))
                                }
                            />

                            <label className="form-label">Couleur</label>

                            <div className="d-flex gap-2 mb-3">
                                {[
                                    "#0d6efd",
                                    "#198754",
                                    "#dc3545",
                                    "#ffc107",
                                    "#6f42c1",
                                    "#fd7e14",
                                ].map((color) => (
                                    <div
                                        key={color}
                                        title={color}
                                        onClick={() =>
                                            setEditForm((p) => ({ ...p, color }))
                                        }
                                        style={{
                                            width: "28px",
                                            height: "28px",
                                            backgroundColor: color,
                                            borderRadius: "6px",
                                            cursor: "pointer",
                                            border:
                                                editForm.color === color
                                                    ? "3px solid #000"
                                                    : "1px solid #ddd",
                                            transition: "all 0.2s ease",
                                        }}
                                    />
                                ))}
                            </div>

                            <input
                                type="hidden"
                                value={editForm.color}
                                readOnly
                            />


                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label">Début</label>
                                    <input
                                        type="datetime-local"
                                        className="form-control"
                                        value={editForm.start}
                                        onChange={(e) =>
                                            setEditForm((p) => ({ ...p, start: e.target.value }))
                                        }
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label">Fin</label>
                                    <input
                                        type="datetime-local"
                                        className="form-control"
                                        value={editForm.end}
                                        onChange={(e) =>
                                            setEditForm((p) => ({ ...p, end: e.target.value }))
                                        }
                                    />
                                </div>
                            </div>

                            <div className="alert alert-warning mt-3 mb-0">
                                <strong>Attention :</strong> tu peux aussi supprimer cet événement.
                            </div>
                        </div>

                        <div className="modal-footer d-flex justify-content-between">
                            <button
                                type="button"
                                className="btn btn-outline-danger"
                                onClick={askDeleteEvent}
                            >
                                <i className="fa fa-trash me-2"></i>
                                Supprimer
                            </button>

                            <div className="d-flex gap-2">
                                <button
                                    className="btn btn-light border"
                                    data-bs-dismiss="modal"
                                >
                                    Annuler
                                </button>

                                <button className="btn btn-primary" onClick={submitEditEvent}>
                                    Enregistrer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/*===== Modal de Lecture Seule =====*/}
            <div className="modal fade" ref={readModalRef} tabIndex={-1}>
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">{readOnlyEvent?.title || "Détails de l'événement"}</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div className="modal-body">
                            <p><strong>Description :</strong> {readOnlyEvent?.description || "Aucune description"}</p>
                            <p><strong>Début :</strong> {readOnlyEvent?.start}</p>
                            <p><strong>Fin :</strong> {readOnlyEvent?.end}</p>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Fermer</button>
                        </div>
                    </div>
                </div>
            </div>


            {/* ================= MODAL CONFIRM DELETE ================= */}
            <div ref={confirmDeleteModalRef} className="modal fade" tabIndex={-1}>
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title text-danger">
                                <i className="fa fa-warning me-2"></i>
                                Confirmer la suppression
                            </h5>
                            <button className="btn-close" data-bs-dismiss="modal"></button>
                        </div>

                        <div className="modal-body">
                            Voulez-vous vraiment supprimer cet événement ?
                            <div className="text-muted small mt-2">
                                Cette action est irréversible.
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-light border" data-bs-dismiss="modal">
                                Annuler
                            </button>

                            <button className="btn btn-danger" onClick={confirmDeleteEvent}>
                                Oui, supprimer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Agenda
