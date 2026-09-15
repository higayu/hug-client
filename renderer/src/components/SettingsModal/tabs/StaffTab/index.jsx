import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useSelector } from 'react-redux'

import { useAppState } from '@/AppStateContext'
import { useDataBase } from '@/hooks/useDataBase'
import { useStaff } from './useStaff'
import { useToast } from '@/provider/ToastProvider/ToastContext'
import { selectLaravelAuth } from '@/store/slices/authSlice'

const initialForm = {
  id: '',
  name: '',
  work_style: '',
  notes: '',
  is_delete: 0,
  role_id: 0,
  display_order: '',
  entered_at: '',
  leaving_at: '',
  use_my_prompt: 0,
}

/**
 * DBの日付をinput[type="date"]用の形式に変換する。
 */
const toInputDate = (value) => {
  if (!value) {
    return ''
  }

  return String(value).slice(0, 10)
}

/**
 * 空文字をnullへ変換する。
 */
const toNullable = (value) => {
  const text = String(
    value ?? '',
  ).trim()

  return text === ''
    ? null
    : text
}

/**
 * 空文字をnull、数値文字列をnumberへ変換する。
 */
const toNullableNumber = (value) => {
  const text = String(
    value ?? '',
  ).trim()

  if (text === '') {
    return null
  }

  const number = Number(text)

  return Number.isFinite(number)
    ? number
    : null
}

export default function StaffTab({
  staffId,
  title = '職員情報',
}) {
  const auth = useSelector(selectLaravelAuth)
  const isAdmin = Number(auth.user?.role_id) === 1

  const {
    STAFF_ID,
    databaseState,
  } = useAppState()

  const targetStaffId = staffId ?? STAFF_ID

  const {
    reloadData,
  } = useDataBase()

  const {
    updateStaff,
  } = useStaff()

  const {
    showSuccessToast,
    showErrorToast,
  } = useToast()

  const [
    form,
    setForm,
  ] = useState(initialForm)

  const [
    selectedFacilities,
    setSelectedFacilities,
  ] = useState([])

  const [
    isSaving,
    setIsSaving,
  ] = useState(false)

  /*
   * DBデータ
   */
  const staffs = useMemo(() => {
    return Array.isArray(
      databaseState?.staffs,
    )
      ? databaseState.staffs
      : []
  }, [
    databaseState?.staffs,
  ])

  const facilities = useMemo(() => {
    return Array.isArray(
      databaseState?.facilitys,
    )
      ? databaseState.facilitys
      : []
  }, [
    databaseState?.facilitys,
  ])

  const facilityStaff = useMemo(() => {
    return Array.isArray(
      databaseState?.facility_staff,
    )
      ? databaseState.facility_staff
      : []
  }, [
    databaseState?.facility_staff,
  ])

  /*
   * 現在選択中のスタッフ
   */
  const currentStaff = useMemo(() => {
    return (
      staffs.find(
        (staff) =>
          String(staff?.id) ===
          String(targetStaffId),
      ) ?? null
    )
  }, [
    staffs,
    targetStaffId,
  ])

  /*
   * STAFF_IDまたはDBデータ変更時に
   * フォームへ現在のスタッフ情報を反映する。
   */
  useEffect(() => {
    if (!currentStaff) {
      setForm(initialForm)
      setSelectedFacilities([])

      return
    }

    setForm({
      id:
        currentStaff.id ?? '',

      name:
        currentStaff.name ?? '',

      work_style:
        currentStaff.work_style ?? '',

      notes:
        currentStaff.notes ?? '',

      is_delete:
        Number(
          currentStaff.is_delete ?? 0,
        ),

      role_id:
        Number(
          currentStaff.role_id ?? 0,
        ),

      display_order:
        currentStaff.display_order ?? '',

      entered_at:
        toInputDate(
          currentStaff.entered_at,
        ),

      leaving_at:
        toInputDate(
          currentStaff.leaving_at,
        ),

      use_my_prompt:
        Number(
          currentStaff.use_my_prompt ?? 0,
        ) === 1
          ? 1
          : 0,
    })

    /*
     * facility_staffから
     * 現在スタッフの所属施設ID一覧を取得する。
     */
    const facilityIds =
      facilityStaff
        .filter(
          (relation) =>
            String(
              relation?.staff_id,
            ) ===
            String(
              currentStaff.id,
            ),
        )
        .map(
          (relation) =>
            Number(
              relation.facility_id,
            ),
        )
        .filter(
          Number.isFinite,
        )

    setSelectedFacilities(
      facilityIds,
    )
  }, [
    currentStaff,
    facilityStaff,
  ])

  /**
   * フォーム変更
   */
  const handleChange = (
    event,
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target

    const nextValue =
      type === 'checkbox'
        ? checked
          ? 1
          : 0
        : value

    setForm(
      (previous) => ({
        ...previous,
        [name]: nextValue,
      }),
    )
  }

  /**
   * 所属施設の選択・解除
   */
  const toggleFacility = (
    facilityId,
  ) => {
    const normalizedId =
      Number(facilityId)

    if (
      !Number.isFinite(
        normalizedId,
      )
    ) {
      return
    }

    setSelectedFacilities(
      (previous) => {
        if (
          previous.includes(
            normalizedId,
          )
        ) {
          return previous.filter(
            (value) =>
              value !==
              normalizedId,
          )
        }

        return [
          ...previous,
          normalizedId,
        ]
      },
    )
  }

  /**
   * 保存
   */
  const handleSave = async () => {
    if (isSaving) {
      return
    }

    if (!targetStaffId) {
      showErrorToast(
        'スタッフが選択されていません。',
      )

      return
    }

    if (
      !form.name.trim()
    ) {
      showErrorToast(
        'スタッフ名を入力してください。',
      )

      return
    }

    if (
      selectedFacilities.length ===
      0
    ) {
      showErrorToast(
        '少なくとも1つの施設を選択してください。',
      )

      return
    }

    setIsSaving(true)

    try {
      /*
       * useStaffへ渡すスタッフ情報
       */
      const staff = {
        name:
          form.name.trim(),

        work_style:
          toNullable(
            form.work_style,
          ),

        notes:
          form.notes ?? '',

        display_order:
          toNullableNumber(
            form.display_order,
          ),

        entered_at:
          toNullable(
            form.entered_at,
          ),

        leaving_at:
          toNullable(
            form.leaving_at,
          ),

        /*
         * DB上の現在値から変更された場合だけ更新する。
         * 変更なしの場合はnullを渡し、
         * update_staff側で既存値を維持する。
         */
        use_my_prompt:
          Number(form.use_my_prompt) !==
          Number(currentStaff.use_my_prompt ?? 0)
            ? Number(form.use_my_prompt) === 1
              ? 1
              : 0
            : null,

        ...(isAdmin
          ? {
              is_delete:
                Number(form.is_delete) === 1 ? 1 : 0,
              role_id:
                Number(form.role_id) === 1 ? 1 : 0,
            }
          : {}),
      }

      const payload = {
        staffId:
          Number(targetStaffId),

        staff,

        facilityIds:
          selectedFacilities.map(
            Number,
          ),
      }

      console.log(
        '[StaffTab] 職員情報更新:',
        payload,
      )

      /*
       * Laravelへの更新処理は
       * useStaff側へ委譲する。
       */
      const result =
        await updateStaff(
          payload,
        )

      console.log(
        '[StaffTab] 更新結果:',
        result,
      )

      /*
       * Redux/databaseStateを
       * 最新のDB状態へ更新する。
       */
      if (
        typeof reloadData ===
        'function'
      ) {
        await reloadData({
          reason:
            'staff-updated',
          force: true,
        })
      }

      showSuccessToast(
        '職員情報を更新しました。',
      )
    } catch (error) {
      console.error(
        '[StaffTab] 更新エラー:',
        error,
      )

      console.error(
        '[StaffTab] 更新エラー詳細:',
        error?.response?.data,
      )

      showErrorToast(
        error?.response?.data
          ?.message ||
          error?.message ||
          '職員情報の更新に失敗しました。',
      )
    } finally {
      setIsSaving(false)
    }
  }

  /*
   * STAFF_ID未選択
   */
  if (!targetStaffId) {
    return (
      <div>
        <h3 className="mb-2 border-b border-gray-200 pb-2 text-lg text-gray-700">
          {title}
        </h3>

        <p className="py-8 text-center text-gray-500">
          API設定からスタッフを選択してください。
        </p>
      </div>
    )
  }

  /*
   * databaseStateに
   * 対象スタッフが存在しない
   */
  if (!currentStaff) {
    return (
      <div>
        <h3 className="mb-2 border-b border-gray-200 pb-2 text-lg text-gray-700">
          {title}
        </h3>

        <p className="py-8 text-center text-gray-500">
          スタッフ情報を取得できませんでした。
        </p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="mb-2 border-b border-gray-200 pb-2 text-lg text-gray-700">
        {title}
      </h3>

      <p className="mb-5 text-sm text-gray-600">
        現在選択中のスタッフ情報を編集します。
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* スタッフID */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            スタッフID
          </label>

          <input
            type="text"
            value={form.id}
            readOnly
            className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2"
          />
        </div>

        {/* 名前 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            名前
          </label>

          <input
            type="text"
            name="name"
            value={form.name}
            onChange={
              handleChange
            }
            maxLength={50}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>

        {/* 勤務形態 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            勤務形態
          </label>

          <input
            type="text"
            name="work_style"
            value={
              form.work_style
            }
            onChange={
              handleChange
            }
            maxLength={20}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>

        {/* 表示順 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            表示順
          </label>

          <input
            type="number"
            name="display_order"
            value={
              form.display_order
            }
            onChange={
              handleChange
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>

        {/* 入社日 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            入社日
          </label>

          <input
            type="date"
            name="entered_at"
            value={
              form.entered_at
            }
            onChange={
              handleChange
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>

        {/* 退社日 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            退社日
          </label>

          <input
            type="date"
            name="leaving_at"
            value={
              form.leaving_at
            }
            onChange={
              handleChange
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>

        {/* 個人プロンプト */}
        <div className="flex items-end">
          <label className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              name="use_my_prompt"
              checked={
                Number(
                  form.use_my_prompt,
                ) === 1
              }
              onChange={
                handleChange
              }
              className="h-4 w-4"
            />

            個人プロンプトを使用する
          </label>
        </div>
      </div>

      {/* 権限・削除状態 */}
      {isAdmin && (
      <div className="mt-5 flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            name="role_id"
            checked={
              Number(
                form.role_id,
              ) === 1
            }
            onChange={
              handleChange
            }
            className="h-4 w-4"
          />

          管理者
        </label>

        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            name="is_delete"
            checked={
              Number(
                form.is_delete,
              ) === 1
            }
            onChange={
              handleChange
            }
            className="h-4 w-4"
          />

          削除済み
        </label>
      </div>
      )}

      {/* メモ */}
      <div className="mt-5">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          メモ
        </label>

        <textarea
          name="notes"
          value={form.notes}
          onChange={
            handleChange
          }
          rows={4}
          className="w-full resize-y rounded-md border border-gray-300 px-3 py-2 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      {/* 所属施設 */}
      <div className="mt-5">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          所属施設
        </label>

        {facilities.length === 0 ? (
          <p className="text-sm text-gray-500">
            施設情報がありません。
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {facilities
              .filter(
                (facility) =>
                  Number(
                    facility?.is_delete ??
                      0,
                  ) === 0,
              )
              .map(
                (facility) => {
                  const facilityId =
                    Number(
                      facility.id,
                    )

                  const selected =
                    selectedFacilities.includes(
                      facilityId,
                    )

                  return (
                    <button
                      key={
                        facility.id
                      }
                      type="button"
                      onClick={() =>
                        toggleFacility(
                          facilityId,
                        )
                      }
                      className={`rounded-md border px-4 py-2 text-sm transition ${
                        selected
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {
                        facility.name
                      }
                    </button>
                  )
                },
              )}
          </div>
        )}
      </div>

      {/* 保存 */}
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={
            handleSave
          }
          disabled={
            isSaving
          }
          className="rounded-md bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving
            ? '保存中...'
            : '職員情報を保存'}
        </button>
      </div>
    </div>
  )
}
