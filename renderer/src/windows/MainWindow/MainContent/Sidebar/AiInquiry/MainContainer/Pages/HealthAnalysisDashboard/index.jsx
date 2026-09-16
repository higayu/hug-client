// src/pages/HealthAnalysisDashboard.jsx
import { useEffect, useMemo, useState } from 'react';
import { useAppState } from '@/AppStateContext';
import { useChilledSpace } from '@/hooks/useChilledSpace';
import SelectionPanel from './SelectionPanel';

const getFacilityId = (facility) => facility?.facility_id ?? facility?.id ?? null;
const getChildId = (child) => child?.child_id ?? child?.children_id ?? child?.id ?? null;
const getChildName = (child) => child?.name ?? child?.children_name ?? '';
const isActiveChild = (child) => Number(child?.is_delete ?? 0) !== 1;
const sameId = (left, right) => String(left) === String(right);
const toTable = (value) => (Array.isArray(value) ? value : []);

export default function HealthAnalysisDashboard(){
  const {
    FACILITY_ID,
    databaseState,
    setFacilityId,
  } = useAppState();

  const { childId, setChild } = useChilledSpace();

  const facilities = toTable(databaseState?.facilitys);
  const allChildren = toTable(databaseState?.children);
  const facilityChildren = toTable(databaseState?.facility_children);
  const facilityId = Number(FACILITY_ID);

  const children = useMemo(() => {
    const activeChildren = allChildren.filter(isActiveChild);

    if (!facilityId || facilityChildren.length === 0) {
      return activeChildren;
    }

    const childIdsForFacility = new Set(
      facilityChildren
        .filter((row) => sameId(row?.facility_id, facilityId))
        .map((row) => String(row?.children_id)),
    );

    return activeChildren.filter((child) =>
      childIdsForFacility.has(String(getChildId(child))),
    );
  }, [allChildren, facilityChildren, facilityId]);

  useEffect(() => {
    if ((!facilityId || facilityId <= 0) && facilities.length > 0) {
      setFacilityId(getFacilityId(facilities[0]));
    }
  }, [facilities, facilityId, setFacilityId]);

  useEffect(() => {
    const selectedChild = children.find((child) =>
      sameId(getChildId(child), childId),
    );

    if (selectedChild) return;

    const firstChild = children[0];
    setChild(
      firstChild ? getChildId(firstChild) : '',
      firstChild ? getChildName(firstChild) : '',
    );
  }, [childId, children, setChild]);

  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [state, setState] = useState({
    loading: false,
    error: null,
    result: null,
    statistics: null,
    logs: [],
    abnormalChildren: [],
  });

  const facilitiesLoading = false;
  const childrenLoading = false;

  const selectedFacilityName = facilities.find((facility) =>
    sameId(getFacilityId(facility), facilityId),
  )?.name;
  const selectedChildName = children.find((child) =>
    sameId(getChildId(child), childId),
  );

  const handleAnalyze = async () => {
    if (!facilityId || !childId) {
      setState((prev) => ({
        ...prev,
        error: '事業所と児童を選択してください。',
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const api = window.electronAPI;

      if (typeof api?.laravel_healthAnalysis_analyze !== 'function') {
        throw new Error('健康分析APIが利用できません。アプリを再起動してください。');
      }

      const analysisResponse = await api.laravel_healthAnalysis_analyze({
        year,
        month,
        childId: Number(childId),
      });

      if (analysisResponse?.success === false) {
        throw new Error(analysisResponse.message || '健康分析に失敗しました。');
      }

      const [statisticsResponse, abnormalResponse, logsResponse] =
        await Promise.all([
          api.laravel_healthAnalysis_statistics({ year, month }),
          api.laravel_healthAnalysis_abnormalChildren({ year, month, limit: 50 }),
          api.laravel_healthAnalysis_logs({
            children_id: Number(childId),
            limit: 50,
          }),
        ]);

      const failedResponse = [statisticsResponse, abnormalResponse, logsResponse]
        .find((response) => response?.success === false);

      if (failedResponse) {
        throw new Error(failedResponse.message || '健康分析データの取得に失敗しました。');
      }

      setState((prev) => ({
        ...prev,
        result: analysisResponse?.data ?? null,
        statistics: statisticsResponse?.data ?? null,
        abnormalChildren: abnormalResponse?.data ?? [],
        logs: logsResponse?.data ?? [],
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error?.message || '健康分析データの取得に失敗しました。',
      }));
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="w-full">
      <header className="mb-6">
        <h1>健康分析ダッシュボード</h1>
        <p style={{ color: 'var(--text-light)' }}>
          児童の健康記録をAIで分析し、異常や傾向を検出します。
        </p>
      </header>

      {/* パラメータ設定 */}
      <div className="card mb-6">
        <h2 className="mb-4">分析条件設定</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <SelectionPanel
            facilities={facilities}
            children={children}
            facilityId={facilityId}
            childId={childId}
            facilitiesLoading={facilitiesLoading}
            childrenLoading={childrenLoading}
            onFacilityChange={(value) => {
              setFacilityId(value);
              setChild('', '');
            }}
            onChildChange={(value) => {
              const selectedChild = children.find((child) =>
                sameId(getChildId(child), value),
              );
              setChild(value, getChildName(selectedChild));
            }}
          />

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label className="label">年</label>

              <input
                type="number"
                className="input-field"
                min={2020}
                max={new Date().getFullYear()}
                value={year}
                onChange={(e) => {
                  setYear(parseInt(e.target.value, 10));
                }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <label className="label">月</label>

              <input
                type="number"
                className="input-field"
                min={1}
                max={12}
                value={month}
                onChange={(e) => {
                  setMonth(parseInt(e.target.value, 10));
                }}
              />
            </div>
          </div>

          {/* 選択中の分析対象 */}
          <div className="p-3 bg-gray-50 text-gray-700 rounded">
            <div>分析対象事業所: {selectedFacilityName || '未選択'}</div>
            <div>分析対象児童: {getChildName(selectedChildName) || '未選択'}</div>
            <div>
              対象期間: {year}年{month}月
            </div>
          </div>

          {state.error && (
            <div className="p-3 bg-red-100 text-red-700 rounded">
              {state.error}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAnalyze}
              disabled={state.loading || !facilityId || !childId}
            >
              {state.loading ? '分析中...' : '分析実行'}
            </button>
          </div>
        </div>
      </div>

      {/* 個人分析結果 */}
      {state.result && typeof state.result.summary === 'string' && (
        <div className="card mb-6">
          <h2 className="mb-4">分析結果</h2>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold">{state.result.summary}</span>
              <span className="text-sm text-gray-600">
                信頼度: {((Number(state.result.confidence) || 0) * 100).toFixed(1)}%
              </span>
            </div>
            {state.result.observations && (
              <p><span className="font-bold">観察事項:</span> {state.result.observations}</p>
            )}
            {state.result.recommendations && (
              <p><span className="font-bold">推奨対応:</span> {state.result.recommendations}</p>
            )}
          </div>
        </div>
      )}

      {/* 全体分析サマリー */}
      {state.result?.summary && typeof state.result.summary === 'object' && (
        <div className="card mb-6">
          <h2 className="mb-4">分析サマリー</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">総児童数</p>
              <p className="text-xl font-bold">
                {state.result.summary.total_children}
              </p>
            </div>

            <div className="p-3 bg-green-50 rounded">
              <p className="text-sm text-gray-600">異常なし</p>
              <p className="text-xl font-bold text-green-600">
                {state.result.summary.normal}
              </p>
            </div>

            <div className="p-3 bg-yellow-50 rounded">
              <p className="text-sm text-gray-600">要注目</p>
              <p className="text-xl font-bold text-yellow-600">
                {state.result.summary.needs_attention}
              </p>
            </div>

            <div className="p-3 bg-red-50 rounded">
              <p className="text-sm text-gray-600">異常あり</p>
              <p className="text-xl font-bold text-red-600">
                {state.result.summary.abnormal}
              </p>
            </div>
          </div>

          <div className="mt-4 text-sm" style={{ color: 'var(--text-light)' }}>
            分析者: {state.result.summary.analyzed_by_name} | 平均信頼度:{' '}
            {(state.result.summary.average_confidence * 100).toFixed(1)}%
          </div>
        </div>
      )}

      {/* 異常児童一覧 */}
      {state.abnormalChildren.length > 0 && (
        <div className="card mb-6">
          <h2 className="mb-4">🚨 異常が検出された児童</h2>

          <div className="w-full overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>ログID</th>
                  <th>児童ID</th>
                  <th>児童名</th>
                  <th>期間</th>
                  <th>ステータス</th>
                  <th>要約</th>
                  <th>信頼度</th>
                  <th>分析日</th>
                </tr>
              </thead>

              <tbody>
                {state.abnormalChildren.map((child) => (
                  <tr key={child.log_id}>
                    <td>{child.log_id}</td>
                    <td>{child.child_id}</td>
                    <td>{child.child_name || '不明'}</td>
                    <td>{child.period || '不明'}</td>
                    <td>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          child.status === 'abnormal'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {child.status === 'abnormal' ? '⚠ 異常' : '要注目'}
                      </span>
                    </td>
                    <td className="max-w-xs truncate">{child.summary}</td>
                    <td>{(child.confidence * 100).toFixed(1)}%</td>
                    <td>{new Date(child.analyzed_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 統計情報 */}
      {state.statistics && (
        <div className="card">
          <h2 className="mb-4">📊 統計情報</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm" style={{ color: 'var(--text-light)' }}>
                総記録数
              </p>
              <p className="text-xl font-bold">
                {state.statistics.total_records}
              </p>
            </div>

            <div>
              <p className="text-sm" style={{ color: 'var(--text-light)' }}>
                対象児童数
              </p>
              <p className="text-xl font-bold">
                {state.statistics.unique_children}
              </p>
            </div>
          </div>

          {state.statistics.staff_records && state.statistics.staff_records.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium" style={{ color: 'var(--text-light)' }}>
                スタッフ別記録数
              </p>
              <div className="mt-2 space-y-1">
                {state.statistics.staff_records.map((staff) => (
                  <div key={staff.staff_id} className="flex justify-between text-sm">
                    <span>{staff.staff_name}</span>
                    <span className="font-medium">{staff.record_count}件</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 分析ログ一覧（オプション） */}
      {state.logs.length > 0 && (
        <div className="card mt-6">
          <h2 className="mb-4">📋 分析ログ</h2>
          <div className="w-full overflow-x-auto max-h-60 overflow-y-auto">
            <table className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th>ログID</th>
                  <th>児童ID</th>
                  <th>ステータス</th>
                  <th>要約</th>
                  <th>信頼度</th>
                  <th>分析日</th>
                </tr>
              </thead>
              <tbody>
                {state.logs.map((log) => {
                  const resultData = log.result_data || {};
                  return (
                    <tr key={log.log_id}>
                      <td>{log.log_id}</td>
                      <td>{log.children_id || '-'}</td>
                      <td>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            resultData.status === 'abnormal'
                              ? 'bg-red-100 text-red-800'
                              : resultData.status === 'needs_attention'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {resultData.status === 'abnormal'
                            ? '⚠ 異常'
                            : resultData.status === 'needs_attention'
                            ? '要注目'
                            : '✓ 正常'}
                        </span>
                      </td>
                      <td className="max-w-xs truncate">{resultData.summary || '-'}</td>
                      <td>{resultData.confidence ? (resultData.confidence * 100).toFixed(1) + '%' : '-'}</td>
                      <td>{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
