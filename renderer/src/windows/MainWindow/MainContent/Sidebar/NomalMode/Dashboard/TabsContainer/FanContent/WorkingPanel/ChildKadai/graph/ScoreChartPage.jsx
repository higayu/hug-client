import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import api from "@/api"; // ★ 修正：集約 API（ノーマル）

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";

function ScoreChartPage() {
  const { childrenId, recordTypeId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedChild, setSelectedChild] = useState(null);

  // ▼ Redux から kadai を取得
  const selectedKadai = useSelector((state) => state.kadai.selectedKadai);
  console.log("選択中の課題:", selectedKadai?.record_type_id);


  // --------------------
  // 日付フォーマット
  // --------------------
  const formatDateJP = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };


  // ▼ データ取得
  useEffect(() => {
    const loadChartData = async () => {
      try {
        // ===== グラフデータ（プロシージャ）=====
        const res = await api.sqlApi.callProcedure(
          "houday",
          "GetChildKadaiGraph",
          [childrenId, recordTypeId]
        );

        // ===== マスタ取得 =====
        const [types, childs] = await Promise.all([
          api.sqlApi.get("/houday/record_types"),
          api.sqlApi.get("/houday/child_records_v"),
        ]);

        const seleType = types.find(
          (t) => t.id === selectedKadai.record_type_id
        );

        const seleChild = childs.find(
          (c) => c.children_id === parseInt(selectedKadai.children_id, 10)
        );

        console.log("選択中子供id:", selectedKadai?.children_id);
        console.log("子どもデータ:", childs);
        console.log("記録タイプ:", types);
        console.log("グラフデータ:", res);
        console.log("選択中の記録タイプ:", seleType);
        console.log("選択中の子ども:", seleChild);

        setSelectedChild(seleChild);
        setSelectedType(seleType);

        // ★ res が配列であることを想定
        const records = Array.isArray(res) ? res : [];

        // ★ record_type_id で絞り込み
        const filtered = seleType
          ? records.filter(
              (r) =>
                String(r.record_type_id) === String(seleType.id)
            )
          : [];

        console.log("グラフデータ（フィルター）:", filtered);

        const chartData = filtered.map((r) => ({
          date: formatDateJP(r.date),
          score: r.score ?? 0,
          mistakes: r.mistakes ?? 0,
        }));


        setData(chartData);
      } catch (err) {
        console.error("グラフデータ取得失敗:", err);
      } finally {
        setLoading(false);
      }
    };

    loadChartData();
  }, [childrenId, recordTypeId, selectedKadai]);

  const firstRecord = data.length > 0 ? data[0] : null;
  const lastRecord = data.length > 0 ? data[data.length - 1] : null;


  return (
    <div className="p-6">

      <div className="fixed right-0 w-[300px]">
        <div className="flex justify-around items-center">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-400 text-white rounded"
          >
            ← 戻る
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            🖨 印刷
          </button>
        </div>
      </div>

      <div className="print-area">
            <div className="flex flex-col mb-4">
              <h2 className="text-2xl font-bold mb-2">
                {selectedChild ? selectedChild.child_name : "？？？"} のスコア
              </h2>

              <h2 className="text-green-700 text-2xl font-bold ml-3">
                {selectedType ? selectedType.name : "記録タイプ"}
              </h2>
            </div>

            {loading ? (
              <p>読み込み中...</p>
            ) : (
              <LineChart width={800} height={400} data={data}>
                <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#8884d8"
                  strokeWidth={3}
                />
              </LineChart>
            )}

            {!loading && firstRecord && lastRecord && (
                <div className="print-summary mb-4">
                  <div>
                    初回（{firstRecord.date}）：{firstRecord.score} 
                  </div>
                  <div>
                    最新（{lastRecord.date}）：{lastRecord.score} 
                  </div>
                </div>
              )}
      </div>

    </div>
  );
}

export default ScoreChartPage;
