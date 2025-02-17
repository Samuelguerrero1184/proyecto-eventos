"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Calendar, dayjsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "dayjs/locale/es";
import updateLocale from "dayjs/plugin/updateLocale";
import style from "./calendar.module.css";
import CalendarModal from "@/components/Modals/CalendarModal/CalendarModal";
import MapComponent from "@/components/data/Map/MapComponent";
import { EventsData, DataFormat, sectionStateData } from "@/interfaces";
import CalendarRepository from "@/helpers/Component/Repository/CalendarRepository";
import CalendarController from "@/helpers/Component/Controller/CalendarController";
import { MainBar } from "@/components/mainbar/MainBar";
import CustomToolbar from "@/components/CustomToolbar/CustomToolbar";
import ToolbarFilter from "@/components/ToolbarFilter/ToolbarFilter";

dayjs.extend(updateLocale);
dayjs.locale("es");
dayjs.updateLocale("es", {
  weekdays: [
    "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"
  ],
  months: [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ]
});

const localizer = dayjsLocalizer(dayjs);

export default function DataCalendarResults() {
  const [events, setEvents] = useState<EventsData[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventsData[]>(
    events
  );
  const [dataCalendarResp, setDataCalendarResp] = useState<number>(0);
  const [selectedEvent, setSelectedEvent] = useState<EventsData | null>(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [sectionState, setSectionState] = useState<sectionStateData>({
    axe: "",
    crop: "",
    province: ""
  });
  const [cropState, setCropState] = useState<string[]>([]);
  const [axesState, setAxesState] = useState<string[]>([]);
  const [provinceState, setProvinceState] = useState<string[]>([]);

  useEffect(() => {
    CalendarRepository.fetchEvents()
      .then((data: DataFormat) => {
        const formattedEvents = CalendarController.formatEvents(data);
        const uniqueAxes = CalendarController.getUniqueAxes(formattedEvents);
        const uniqueCrop = CalendarController.getUniqueCrops(formattedEvents);
        const uniqueProvinces = CalendarController.extractProvinces(formattedEvents);
        setEvents(formattedEvents);
        setFilteredEvents(formattedEvents);
        setAxesState([...uniqueAxes]);
        setCropState([...uniqueCrop]);
        setProvinceState([...uniqueProvinces]);
        setDataCalendarResp(200);
      })
      .catch(error => {
        console.error("Error fetching events:", error);
        setDataCalendarResp(-1); // Set error state
      });
  }, []);

  useEffect(() => {
    setSectionState(sectionState);
  }, [sectionState]);

  const filterEvents = (state: sectionStateData) => {
    let tempEvens: EventsData[] = [];
    tempEvens = CalendarController.filterEventsByCrop(events, state.crop);
    tempEvens = CalendarController.filterEventsByProvince(tempEvens, state.province);
    tempEvens = CalendarController.filterEventsByAxe(tempEvens, state.axe);

    setFilteredEvents(tempEvens);
  };

  const handleSelectedEvent = (event: EventsData) => {
    setSelectedEvent(event);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedEvent(null);
  };

  const messages = {
    date: "Fecha",
    time: "Hora",
    event: "Evento",
    allDay: "Todo el día",
    week: "Semana",
    work_week: "Semana laboral",
    day: "Día",
    month: "Mes",
    previous: "Anterior",
    next: "Siguiente",
    yesterday: "Ayer",
    tomorrow: "Mañana",
    today: "Hoy",
    agenda: "Agenda",
    noEventsInRange: "No hay eventos en este rango",
    showMore: (total: number) => `+ Ver más (${total})`
  };

  const eventStyleGetter = (event: any) => {
    let backgroundColor;

    const today = new Date();
    const eventDateEnd = new Date(event.datesEnd);

    if (event.formstate == "1" && eventDateEnd < today) {
      backgroundColor = "#ff0000";
    } else {
      backgroundColor = event.formstate == "0" ? "#80c41c" : "#0e6e8c";
    }

    return {
      style: { backgroundColor }
    };
  };

  return (
    <>
        <div className={style["tableContainer"]}>
          {dataCalendarResp === 200 ? (
            <>
              <MainBar section="Calendario de eventos" />
              <div className={style["containerCaledar"]}>
                <div className={style["calendar"]}>
                  <ToolbarFilter
                    filterEvents={(newState: sectionStateData) => filterEvents(newState)}
                    axesState={axesState}
                    cropState={cropState}
                    provinceState={provinceState}
                    sectionState={sectionState}
                    setSectionState={setSectionState}
                  />
                  <Calendar
                    localizer={localizer}
                    events={filteredEvents}
                    onSelectEvent={handleSelectedEvent}
                    views={{ month: true }}
                    messages={messages}
                    style={{ fontSize: 10 }}
                    eventPropGetter={eventStyleGetter}
                    popup
                    components={{
                      toolbar: (toolbarProps) => (
                        <CustomToolbar
                          {...toolbarProps}
                        />
                      )
                    }}
                  />
                </div>
                <div className={style["mapContainer"]}>
                  <MapComponent provinces={CalendarController.extractProvinces(filteredEvents)} />
                </div>
              </div>
            </>
          ) : dataCalendarResp === 0 ? (
            "Loading..."
          ) : (
            "Ups! something went wrong, try later"
          )}
        </div>
      {selectedEvent && (
        <CalendarModal
          title={selectedEvent.name}
          show={modalIsOpen}
          handleClose={closeModal}
          eventDate={dayjs(selectedEvent.date).format("YYYY-MM-DD")}
          eventDatend={dayjs(selectedEvent.datesEnd).format("YYYY-MM-DD")}
          province={selectedEvent.province}
          axis={selectedEvent.eje}
          organizer={selectedEvent.responsable || "N/A"}
          objetive={selectedEvent.event_objective}
          city={selectedEvent.city}
          crop={selectedEvent.crop}
          institution={selectedEvent.institution}
          guesType={selectedEvent.guess_type}
          email={selectedEvent.email}
        />
      )}
    </>
  );
}