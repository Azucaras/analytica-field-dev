import { useCallback, useEffect, useMemo } from 'react'
import { NumbersView } from '@/components/NumbersView'
import { DecisionView, type CalendarTarget } from '@/components/DecisionView'
import { FieldRecordView } from '@/components/FieldRecordView'
import { ringCentroid } from '@/lib/field-ring'
import { useMapStore } from '@/lib/map-store'
import { usePanelStore } from '@/lib/panel-store'
import { heldSeasonsOf, type SeasonlessPayload, type ZarcWindowRow } from '@/lib/planting-calendar'
import type { RegisteredField } from '@/lib/producer-store'
import { parseFieldLocation } from '@/lib/timeline'
import { useZarcSnapshot } from '@/lib/zarc-snapshot'
import { useAppData } from '@/shell/app-data'
import usWindowsJson from '../../artifacts/us-windows-cass-nd.json'

/**
 * The team's block 6 and block 7 views as panels of the map screen (their block 5.5 plan): Field
 * numbers, Planting calendar and Field record. The data each view reads used to be derived in
 * App.tsx; it is derived here so the panels stay self-contained.
 */

const NO_ROWS: ZarcWindowRow[] = []

/** What the calendar and the field record read: the selected field, its place and the window rows. */
function useCalendarInputs() {
  const { selectedField, selectedFieldId } = useAppData()
  const regionId = useMapStore((state) => state.regionId)
  const registeredFields = useMapStore((state) => state.registeredFields)
  const producerData = useMapStore((state) => state.producerData)
  const chosenDate = useMapStore((state) => state.chosenDate ?? state.axis.default)
  // The ZARC rows are the snapshot the timeline already loads on demand; one download serves both.
  const snapshot = useZarcSnapshot(undefined)
  const windowRows = useMemo(
    () => (snapshot ? snapshot.rows as unknown as ZarcWindowRow[] : NO_ROWS),
    [snapshot],
  )
  const heldSeasons = useMemo(() => heldSeasonsOf(windowRows), [windowRows])
  const registered: RegisteredField | null = registeredFields.find((field) => field.id === selectedFieldId) ?? null
  const fieldName = registered?.name ?? selectedField?.name ?? null
  const place = registered === null ? parseFieldLocation(selectedField?.location ?? null) : null
  // The United States windows are the recorded seasonless source; Brazil reads the ZARC rows.
  const seasonless = regionId === 'us' ? (usWindowsJson as unknown as SeasonlessPayload) : null
  const target: CalendarTarget | null = useMemo(() => {
    if (registered !== null) {
      return { fieldId: registered.id, ring: registered.ring, centroid: ringCentroid(registered.ring), areaHa: registered.area_ha }
    }
    if (selectedField !== null) {
      return {
        fieldId: selectedField.id,
        ring: selectedField.boundary.coordinates[0] as [number, number][],
        centroid: selectedField.center,
        areaHa: null,
      }
    }
    return null
  }, [registered, selectedField])
  const history = selectedFieldId === null ? [] : (producerData[selectedFieldId]?.history ?? [])
  return {
    regionId,
    chosenDate,
    selectedFieldId,
    fieldName,
    place,
    seasonless,
    target,
    history,
    heldSeasons,
    windowRows: seasonless === null ? windowRows : null,
    ready: snapshot !== undefined,
  }
}

export function NumbersPanel() {
  const { scenarios, selectedField } = useAppData()
  return <NumbersView scenarios={scenarios} selectedField={selectedField} />
}

export function CalendarPanel() {
  const inputs = useCalendarInputs()
  if (!inputs.ready) return null
  return (
    <DecisionView
      chosenDate={inputs.chosenDate}
      fieldName={inputs.fieldName}
      heldSeasons={inputs.heldSeasons}
      history={inputs.history}
      numbersTarget={inputs.target}
      place={inputs.place}
      seasonless={inputs.seasonless}
      windowRows={inputs.windowRows}
    />
  )
}

export function FieldRecordPanel() {
  const { selectField, refreshProducer } = useAppData()
  const inputs = useCalendarInputs()
  // Closing the panel ends the drawing mode, so later map clicks do not keep adding hidden vertices.
  useEffect(() => () => usePanelStore.getState().stopDrawing(), [])
  const handleFieldDeleted = useCallback((fieldId: string) => {
    if (useMapStore.getState().selectedFieldId === fieldId) useMapStore.setState({ selectedFieldId: null })
  }, [])
  if (!inputs.ready) return null
  return (
    <FieldRecordView
      chosenDate={inputs.chosenDate}
      heldSeasons={inputs.heldSeasons}
      onChanged={refreshProducer}
      onFieldDeleted={handleFieldDeleted}
      onSelectField={selectField}
      place={inputs.place}
      regionId={inputs.regionId}
      rotationRows={[]}
      selectedFieldId={inputs.selectedFieldId}
      selectedFieldName={inputs.fieldName}
      windowRows={inputs.windowRows}
    />
  )
}
