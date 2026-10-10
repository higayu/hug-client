export function handleAbsenceClick({ onAbsence }) {
  if (typeof onAbsence !== 'function') {
    console.warn('[AbsenceButton] onAbsenceが設定されていません')
    return undefined
  }

  return onAbsence()
}
