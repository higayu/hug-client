// main/parts/handlers/hug/ChildrenUpdateButton/index.jsx
import { useState } from "react"
import { useSelector } from "react-redux"
import { ArrowPathIcon } from "@heroicons/react/24/outline"

import { useToast } from "@/provider/ToastProvider/ToastContext.jsx"
import { useAppState } from "@/AppStateContext"
import { selectFacilityId } from "@/store/slices/appStateSlice"

import { fetchChildrenData } from "./fetchChildrenData.js"

export default function ChildrenUpdateButton({
  facilityId: facilityIdProp,
  disabled = false,
  className = "flex items-center justify-center gap-2 px-4 py-2 text-center bg-yellow-500 text-sm text-white transition-colors hover:bg-yellow-600 disabled:cursor-wait disabled:opacity-60",
  webview = null,
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [label, setLabel] = useState("児童更新")

  const { showInfoToast, showResultToast } = useToast()
  const storeFacilityId = useSelector(selectFacilityId)
  const facilityId = facilityIdProp ?? storeFacilityId
  const { CURRENT_DAY_OF_WEEK } = useAppState()

  const handleClick = async () => {
    if (isLoading || disabled) return


    setIsLoading(true)
    setLabel("児童取得中...")
    showInfoToast(
      "HUGから児童データを取得しています",
      2000,
    )

    try {
      const result = await fetchChildrenData(
        (page, maxPage) => {
          setLabel(`児童取得 ${page}/${maxPage}`)
        },
        facilityId,
        CURRENT_DAY_OF_WEEK,
        webview,
      )

      console.log(
        "[HUG WM] 取得した児童データ:",
        result,
      )
      console.log(
        "[HUG WM] 児童データのサンプル:",
        result.children?.slice(0, 3),
      )


      if (!window.electronAPI?.syncHugChildrens) {
        throw new Error(
          "児童同期APIを利用できません。アプリを再起動してください。",
        )
      }

      setLabel("DB更新中...")

      // facility_idを数値に変換
      const facilityIdNum = Number(facilityId) || 3

      // children配列を整形
      const childrenJson = result.children.map(
        (child) => ({
          id: Number(child.id),
          name: child.name || "",
          furigana: child.furigana || "",
          pronunciation_id:
            child.pronunciation_id
              ? Number(child.pronunciation_id)
              : null,
          children_type_id:
            child.children_type_id || 1,
          notes: child.notes || "",
          notes2: child.notes2 || "",
          personal_tmp: child.personal_tmp || "",
          is_delete: child.is_delete || 0,
          leaving_at: child.leaving_at || null,
        }),
      )

      // register_facility_childrenは
      // facility_idとchildren_jsonの2パラメータ
      const payload = {
        facility_id: facilityIdNum,
        children: childrenJson,
      }

      console.log(
        "[HUG WM] DB送信ペイロード:",
        JSON.stringify(payload, null, 2),
      )

      const syncResult =
        await window.electronAPI.syncHugChildrens(
          payload,
        )

      console.log(
        "[HUG WM] DB同期結果:",
        syncResult,
      )

      const responseSummary =
        syncResult == null
          ? ""
          : typeof syncResult === "string"
            ? syncResult
            : JSON.stringify(syncResult, null, 2)

      const resultData = Array.isArray(syncResult)
        ? syncResult[0]
        : syncResult

      const targetCount =
        resultData?.target_count ??
        childrenJson.length

      const linkInserted =
        resultData?.facility_link_inserted ?? 0

      const linkDeleted =
        resultData?.facility_link_deleted ?? 0

      const deleteCandidates =
        resultData?.delete_candidate_count ?? 0

      showResultToast({
        title: "HUG児童同期 完了",
        message: `${targetCount}件の児童データを同期しました`,
        details: [
          `施設ID: ${facilityIdNum}`,
          `対象児童数: ${targetCount}件`,
          `紐付け追加: ${linkInserted}件`,
          `紐付け削除: ${linkDeleted}件`,
          deleteCandidates > 0
            ? `削除候補: ${deleteCandidates}件`
            : "",
          `対象日: ${result.target_date || "-"}`,
          responseSummary
            ? `DB応答:\n${responseSummary}`
            : "",
        ].filter(Boolean),
        duration: 7000,
      })
    } catch (error) {
      console.error(
        "[HUG WM] 児童同期エラー:",
        error,
      )

      let errorDetails =
        error.message || String(error)

      if (error.response?.data) {
        errorDetails += `\nサーバー応答: ${JSON.stringify(
          error.response.data,
        )}`
      }

      showResultToast({
        title: "HUG児童同期 エラー",
        message:
          "児童データを同期できませんでした",
        details: errorDetails,
        success: false,
        duration: 7000,
      })
    } finally {
      setIsLoading(false)
      setLabel("児童更新")
    }
  }

return (
  <button
    type="button"
    onClick={handleClick}
    disabled={isLoading || disabled}
    className={className}
    title="HUGの児童データを取得してDBへ同期"
  >
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <ArrowPathIcon
        className={`h-5 w-5 shrink-0 ${
          isLoading ? "animate-spin" : ""
        }`}
      />
      <span>{label}</span>
    </span>
  </button>
)
}