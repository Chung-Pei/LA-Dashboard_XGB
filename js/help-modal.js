'use strict';

// ══════════════════════════════════════════════════════════
// help-modal.js
// 統一說明 Modal 系統
// ──────────────────────────────────────────────────────────
// 取代：
//   1. main.js CHART_INFO + attachInfoButtons()（28 個圖表的 hover popover）
//   2. index.html 手寫面板 × 5：bStatsHelp / warningHelp / rRadarInfo /
//      r2Exclude（原 ui-toggles.js 管理）、lsaHelp（原 tab-behavior-lsa.js
//      自建 lsaHelpOverlay）
// 依 22-1_help_modal統整規劃書v4.md §1 決策1：桌面版 hover-preview 取消，
// 全面改為 click 觸發全螢幕 modal（renderHelpModal），三重關閉機制
// （ESC / 點擊 overlay 外部 / ✕ 按鈕）。
//
// 載入順序：chart-registry.js 之後、behavior-loader.js 之前（index.html）。
// 需早於 at-risk-report.js / tab-behavior-lsa.js，讓 window.toggleBStatsHelp /
// window.toggleRRadarInfo 等相容殼層先就位，避免被後載入的舊定義覆蓋
// （v4 已移除該等舊定義，此處為唯一權威來源）。
// ══════════════════════════════════════════════════════════

const HELP_CONTENT = {

  // ══════════════ 類型1：main.js CHART_INFO 系列（28 key，逐字轉換）══════════════

  chartCohortTrend: {
    title: '整屆跨學期趨勢',
    sections: [
      { type: 'desc', text: '各學制在每個學期的平均分走勢。' },
      { type: 'points', items: [
        '折線持續上升 → 教學成效改善，可能反映教學法調整有效',
        '某學期急劇下降 → 查明原因（課程難度？師資異動？）',
        '各學制差距大 → 學制特性對成效有顯著影響',
      ]},
      { type: 'use', text: '適合截圖作為研究計畫「研究背景」的量化佐證。' },
    ],
  },

  chartProgramBar: {
    title: '各學期學制比較',
    sections: [
      { type: 'desc', text: '同一學期內各學制的平均分群組長條圖。' },
      { type: 'points', items: [
        '長條差距大 → 學制背景對學習成效有顯著影響',
        '所有學制某學期同步下降 → 可能為外部共同因素',
      ]},
      { type: 'use', text: '用於學制差異分析，作為課程差異化設計依據。' },
    ],
  },

  chartPassRate: {
    title: '及格率跨學期趨勢',
    sections: [
      { type: 'desc', text: '各學制及格率（%）的時間趨勢，是比均分更直接的達標指標。' },
      { type: 'points', items: [
        '及格率 > 90% 且穩定 → 課程難度適中',
        '某學期突然跌落 → 檢視評量方式或課程模組是否異動',
        '特定學制持續偏低 → 考慮提供差異化支持',
      ]},
      { type: 'use', text: '及格率是教育研究常用結果變項，可直接呈現於報告。' },
    ],
  },

  heatmapWrap: {
    title: '學期 × 班級成績熱力圖',
    sections: [
      { type: 'desc', text: '顏色越綠分數越高，越紅越低。格子內為確切均分數值。' },
      { type: 'points', items: [
        '橫向看（同一行）→ 追蹤同班跨學期變化',
        '縱向看（同一列）→ 比較同學期各班相對表現',
        '孤立深紅格 → 某班某學期出現異常，值得深入調查',
      ]},
      { type: 'use', text: '一眼掌握多年度多班全貌，快速定位「紅色熱點」。' },
    ],
  },

  boxplotWrap: {
    title: '學制成績分布箱形圖',
    sections: [
      { type: 'desc', text: '標準統計描述工具。橫線=中位數，箱=四分位距，圓點=離群值。' },
      { type: 'points', items: [
        '箱體高（IQR 大）→ 學生成績分散，需差異化教學',
        '中位數遠低於均分 → 分布右偏，少數高分拉高平均',
        '大量低分離群點 → 需個別關注的學生較多',
      ]},
      { type: 'use', text: '學術論文常用的描述統計圖，可直接呈現於結果章節。' },
    ],
  },

  chartCorrelation: {
    title: '人數 vs 及格率相關性',
    sections: [
      { type: 'desc', text: '探討班級規模是否影響及格率。每個點代表一個班次。' },
      { type: 'points', items: [
        '點群呈負相關 → 班級越大及格率越低，支持小班教學',
        '各學制點群分離 → 學制差異比規模影響更大',
        'Hover 可查看班次名稱、學期與確切數值',
      ]},
      { type: 'use', text: '若發現明顯相關性，可計算相關係數納入研究結果。' },
    ],
  },

  chartDist: {
    title: '成績分布直方圖',
    sections: [
      { type: 'desc', text: '各分數區間的學生人數。60分以上綠色，以下紅色。' },
      { type: 'points', items: [
        '鐘型分布 → 評量難度適中',
        '左偏（高分集中）→ 課程偏易',
        '右偏（低分集中）→ 課程偏難，評量方式可考慮調整',
        '雙峰 → 學生兩極分化，需差異化教學',
      ]},
      { type: 'use', text: '快速掌握班級整體成績分布形態。' },
    ],
  },

  chartNormalOverlay: {
    title: '常態分布曲線疊加',
    sections: [
      { type: 'desc', text: '在直方圖上疊加理論常態曲線（灰色虛線），以實際均分與標準差計算。' },
      { type: 'points', items: [
        '實際分布與曲線吻合 → 成績接近常態，符合統計假設',
        '明顯偏離 → 存在地板效應（整體偏低）或天花板效應（整體偏高）',
      ]},
      { type: 'use', text: '判斷是否符合常態假設，作為 t 檢定等分析的前提確認。' },
    ],
  },

  chartMidFinal: {
    title: '期中 vs 期末指標對比',
    sections: [
      { type: 'desc', text: '並排比較期中均分、期末均分與學期均分三項指標。' },
      { type: 'points', items: [
        '期末 > 期中 → 學生後段有所進步',
        '期末 < 期中 → 後段學習退步，課程後半段難度可能提升',
        '學期明顯高於期末 → 加分機制發生作用',
      ]},
      { type: 'use', text: '評量設計一致性檢討，判斷期中期末難度是否均衡。' },
    ],
  },

  chartRegression: {
    title: '期中 → 期末線性迴歸',
    sections: [
      { type: 'desc', text: '每個點代表一位學生（X=期中，Y=期末），橘色線為迴歸線，R² 顯示預測力。' },
      { type: 'points', items: [
        'R² 接近 1.0 → 期中高度預測期末，兩次評量一致性高',
        'R² 接近 0.0 → 期中幾乎無法預測期末，測量不同能力',
        '右下角點（期中高但期末低）→「後段滑落型」學生',
        '左上角點（期中低但期末高）→「後段爆發型」學生',
      ]},
      { type: 'use', text: '識別期中後需追蹤的學生，作為補救教學介入依據。' },
    ],
  },

  chartTrend: {
    title: '跨屆趨勢折線圖',
    sections: [
      { type: 'desc', text: '同班級名稱跨學期的期中、期末、學期成績均分趨勢。' },
      { type: 'points', items: [
        '三條折線同步上升 → 教學成效逐年改善',
        '某學期同步下跌後恢復 → 可能為偶發因素',
        '期末與期中走勢不同步 → 期末考難度或評量方式可能調整過',
      ]},
      { type: 'use', text: '教學法介入（前後比較）的佐證，適合呈現於研究計畫。' },
    ],
  },

  chartVariance: {
    title: '與前次同班比較 Δ',
    sections: [
      { type: 'desc', text: '各指標相對上一個有同班資料學期的變化量。綠色=進步，紅色=退步。' },
      { type: 'points', items: [
        '全部指標綠色 → 本學期全面優於上學期',
        '及格率進步但均分退步 → 低分學生改善，整體水準略降',
        '顯示「無前期資料」→ 該班首次開課或前學期資料未匯入',
      ]},
      { type: 'use', text: '即時掌握本學期相對上學期的教學成效變化。' },
    ],
  },

  chartAnomalyDensity: {
    title: '各學期異常事件密度',
    sections: [
      { type: 'desc', text: '全體學生各類異常標籤每學期的發生人次。' },
      { type: 'points', items: [
        '🟡 黃色折線升高 → 某學期後測執行率偏低或缺考增加',
        '🔵 藍色峰值 → 該學期同意書收取流程出現問題',
        '🔴 紅色出現 → 考試誠信問題，應個別追蹤',
        '整體趨勢下降 → 班級管理與學習文化改善',
      ]},
      { type: 'use', text: '班級管理或課程執行品質的長期監控指標。' },
    ],
  },

  chartRetakerFirstDist: {
    title: '重修生首修成績分布',
    sections: [
      { type: 'desc', text: '有重修記錄的學生，其「第一次修課」時的成績分布。' },
      { type: 'points', items: [
        '集中在 50–59 分 → 接近及格邊緣的學生重修率最高',
        '集中在 40 分以下 → 需更早介入（如期中後補救教學）',
        '首修 ≥ 60 卻重修 → 可能有特殊情況，至個案追蹤確認',
      ]},
      { type: 'use', text: '預警介入對象的輪廓分析，搭配頁籤 B 使用。' },
    ],
  },

  slopeChart: {
    title: '首修 → 重修進退步坡度圖',
    sections: [
      { type: 'desc', text: '每位重修生以一條連線表示，綠色=進步，紅色=退步。' },
      { type: 'points', items: [
        '綠線多且陡 → 重修整體改善效果顯著',
        '紅線多 → 重修後仍退步，需調整輔導策略',
        '水平線 → 重修沒有顯著改變',
      ]},
      { type: 'use', text: '一眼掌握補救教學整體成效。' },
    ],
  },

  chartDelta: {
    title: 'Δ 分佈直方圖',
    sections: [
      { type: 'desc', text: '所有重修生「重修成績 − 首修成績」（Δ）的分布。正值=進步，負值=退步。' },
      { type: 'points', items: [
        '集中在 +10 至 +20 → 多數重修生進步約 10–20 分，機制有效',
        '分布以 0 對稱 → 重修成效不一，需個案分析',
        '大量負值 → 重修機制需要檢討',
      ]},
      { type: 'use', text: '評估補救教學制度性成效。' },
    ],
  },

  chartQuadrant: {
    title: '正課 × 實驗課四象限',
    sections: [
      { type: 'desc', text: '以正課（X軸）與實驗課（Y軸）成績定位重修學生。' },
      { type: 'points', items: [
        'Q1 右上（雙強）→ 無需介入',
        'Q2 左上（正課弱/實驗強）→ 加強流病報告邏輯輔導',
        'Q3 左下（雙弱）→ 高風險，優先個別輔導',
        'Q4 右下（正課強/實驗弱）→ 補充致病機轉概念圖',
      ]},
      { type: 'use', text: '差異化輔導方向判斷，根據象限位置制定介入策略。' },
    ],
  },

  chartDeltaByProgram: {
    title: '重修成績變化量依學制比較',
    sections: [
      { type: 'desc', text: '各學制重修生的平均 Δ 值（成績變化量）比較。' },
      { type: 'points', items: [
        '某學制 Δ 顯著高 → 該學制對重修機制反應較佳',
        '某學制 Δ 為負值 → 需重新評估該學制的輔導策略',
        '各學制 Δ 差異不大 → 個人動機比學制背景更關鍵',
      ]},
      { type: 'use', text: '探討不同學制補救教學成效差異的量化佐證。' },
    ],
  },

  chartRetakeCount: {
    title: '重修次數分布圖',
    sections: [
      { type: 'desc', text: '重修 1 次、2 次、3 次以上的學生人數分布。' },
      { type: 'points', items: [
        '絕大多數在「重修第 1 次」→ 一次重修後即達標，機制有效',
        '「重修第 2 次」不少 → 有持續困難學生，需長期追蹤',
        '出現「重修第 3 次」→ 啟動積極介入，考慮學習障礙評估',
      ]},
      { type: 'use', text: '識別需要長期輔導的持續困難學生群體。' },
    ],
  },

  chartFirstVsDelta: {
    title: '首修成績 vs 重修成績變化量',
    sections: [
      { type: 'desc', text: 'X=首修成績，Y=重修 Δ。探索「首修越低改善越多」或其他規律。' },
      { type: 'points', items: [
        '左上角（首修低，Δ 大正值）→「低谷反彈型」，補救效果顯著',
        '右下角（首修高，Δ 為負值）→「高原退步型」，疏於準備',
        '無明顯趨勢 → 個別差異大，首修成績無法預測成績變化量',
      ]},
      { type: 'use', text: '判斷補救教學介入時機，Hover 可查看遮蔽學號。' },
    ],
  },

  radarChart: {
    title: '學習行為資源使用雷達圖',
    sections: [
      { type: 'desc', text: '依六種教材資源完成率，將學生分為五種資源使用型態（R1–R5）。' },
      { type: 'points', items: [
        '面積越大 → 該群學習投入度越高，多媒體使用越多元',
        '特定維度突出 → 找出各群的主力學習工具，作為差異化教學依據',
        '切換「及格/不及格」視圖 → 觀察通過與未通過學生的行為輪廓差異',
      ]},
      { type: 'use', text: '用於識別資源使用型態與學習成效的關聯（Mayer, 2009；Zimmerman, 2002），適合作為主動學習介入的分群佐證。與序列轉移分析（S1–S5）互補使用效果更佳。' },
    ],
  },

  scatterChart: {
    title: '行為指標相關性散佈圖',
    sections: [
      { type: 'desc', text: '點擊相關性熱力圖的儲存格後，顯示對應兩項行為指標的學生分布。' },
      { type: 'points', items: [
        '點群呈正相關 → 兩項行為同步增減，可合併為單一學習投入指標',
        '點群呈負相關 → 兩種學習策略存在替代關係',
        'Hover 可查看個別學生資訊，利於個案追蹤',
      ]},
      { type: 'use', text: '驗證行為指標間的統計關聯，作為建立預測模型的前置分析。' },
    ],
  },

  weeklyQuizChart: {
    title: '各週題庫作答強度',
    sections: [
      { type: 'desc', text: '以週為單位呈現全體學生題庫作答次數的趨勢。' },
      { type: 'points', items: [
        '考前幾週明顯峰值 → 學生傾向臨時抱佛腳，可引導平時練習',
        '整學期均勻分布 → 自主學習習慣良好',
        '某週突然下降 → 可能與校內活動或其他課程評量撞期',
      ]},
      { type: 'use', text: '量化學習節律，作為課程設計（作業分散化）的參考依據。' },
    ],
  },

  preExamChart: {
    title: '平時及考前學習強度分型（V2.1）',
    sections: [
      { type: 'desc', text: '核心指標：T_total（期間總閱讀時數）、P_pre = T_pre ÷ T_total × 100%（考前 7 天占比）。' },
      { type: 'points', items: [
        '① 學習低投入型：T_total < P15 門檻，學習量不足，不分析節奏',
        '② 高度衝刺型：P_pre ≥ 30%（集中學習 Massed Practice）',
        '③ 規律分散型：10% ≤ P_pre < 30%（分散學習 Distributed Practice）',
        '④ 提早完成型：P_pre < 10%（前置規劃 Pre-planning）',
      ]},
      { type: 'use', text: '識別備考模式與成效的關係，引導學生調整學習策略。' },
    ],
  },

  timeSlotChart: {
    title: '學習時段分布',
    sections: [
      { type: 'desc', text: '統計學生一天中各時段使用學習資源的比例。' },
      { type: 'points', items: [
        '夜間比例高 → 學生習慣深夜學習，早課出席率可能受影響',
        '午間峰值 → 碎片化利用午休時間',
        '各時段均勻 → 學習時間自主彈性大，說明非同步教學需求高',
      ]},
      { type: 'use', text: '作為課程素材設計（影片長度、推送時機）的行為依據。' },
    ],
  },

  studyHeatmapWrap: {
    title: '學習規律熱力圖',
    sections: [
      { type: 'desc', text: '顯示一週七天 × 24 小時的學習密集度分布。' },
      { type: 'points', items: [
        '規律出現高密度時段 → 學生有固定學習節奏（Spaced Practice）',
        '集中於特定時段（如深夜）→ 可能影響白天上課專注度',
        '週末明顯低落 → 學習行為受週次作息影響',
      ]},
      { type: 'use', text: '協助識別學生是否有規律的學習節奏，作為差異化教學與課程設計依據。' },
    ],
  },

  hourlyLineChart: {
    title: '24 小時學習活躍度趨勢',
    sections: [
      { type: 'desc', text: 'X 軸為一天 24 小時，Y 軸為正規化學習活躍度。' },
      { type: 'points', items: [
        '高分群（綠線）持續高於其他群 → 學習時間分配策略是成效差異主因',
        '深夜（22:00 後）高峰 → 學生普遍傾向夜間學習',
        '篩選器啟用時分群疊加線暫不顯示 → 避免邏輯衝突',
      ]},
      { type: 'use', text: '跨群學習行為比較，識別高分群的時間投入模式。' },
    ],
  },

  crossSummaryCard: {
    title: '複合行為評分（BAS）與相關係數摘要',
    sections: [
      { type: 'desc', text: '彙整六項學習行為與成績表現的關鍵統計指標，用於評估行為分群與學習結果的關聯強度。' },
      { type: 'points', items: [
        '全體不及格率：訓練集中期末成績不及格學生佔比，並列出期中不及格率對照，觀察學期後段是否好轉',
        'BAS 複合評分（r）：BAS = 期中成績×0.35 + QMI×0.30 + (1−被動指數)×0.20 + log(練習次數)×0.15，r 為 BAS 與期末成績的 Pearson 相關係數，越接近 1 代表綜合行為指標與成績正相關越強',
        'QMI 五分位梯度：依題庫精熟指數切五等分，比較最低分組（Q1）與最高分組（Q5）的不及格率差距，差距越大代表 QMI 對不及格的區辨力越強',
        'R群 × 期末 Spearman（ρ）：R群為教材使用行為分群（類別變數），ρ 衡量分群與期末成績排名的等級相關；R群非品質次序，不可作線性外推解讀',
        'S群 × 期末 Spearman（ρ）：S群依序列轉移穩定性排序（S1最穩定 → S5風險最高，序列事件不足未分類者不納入計算），ρ 方向符合預期時，代表序列越不穩定成績越差',
        '學習方法分布：依 DEEP（深度）/ MODERATE（中等）/ SURFACE（表層）分類學生學習策略佔比，反映整體學習取向',
      ]},
      { type: 'use', text: '｜r｜或｜ρ｜≥ 0.3 通常視為中等以上關聯；R群為類別分群，僅可比較組間差異，不可視為連續尺度。' },
    ],
  },

  // ══════════════ 原手寫 HTML 面板（5 個，逐字轉換自 index.html / tab-behavior-lsa.js）══════════════

  bStatsHelp: {
    title: '📊 統計卡說明',
    sections: [
      { type: 'metric', name: '重修學生 Retakers',
        desc: '在目前篩選條件下，曾重修同一門課的不重複學生人數。' },
      { type: 'metric', name: '進步 Improved（Δ > 0）',
        desc: '重修後成績高於首修成績（分數差 Δ 為正值）的修課次數。' },
      { type: 'metric', name: '退步 Declined（Δ < 0）',
        desc: '重修後成績反而低於首修成績（分數差 Δ 為負值）的修課次數。' },
      { type: 'metric', name: '平均 Δ Avg Delta（首修 → 重修）',
        desc: '所有重修紀錄的「重修分 − 首修分」平均值，正值代表整體有進步，負值代表整體退步。' },
      { type: 'desc', text: 'ℹ Δ = 重修成績 − 首修成績；統計結果會依上方篩選條件即時更新。' },
    ],
  },

  warningHelp: {
    title: '📊 預警指標說明',
    sections: [
      { type: 'metric', name: 'BAS — 行為分析分數',
        desc: '綜合衡量學生在課程期間的線上學習投入程度。',
        formula: 'BAS = w₁×活躍天數比 + w₂×閱讀深度 + w₃×QMI + w₄×期中分數 + w₅×被動指數（對數正規化）',
        note: '分數越低代表行為投入越少、不及格風險越高（範圍 0–1）。' },
      { type: 'metric', name: 'QMI — 題庫精熟指數',
        desc: '反映學生在題庫練習上的「答對品質」與「持續投入」。',
        formula: 'QMI = (加權正確率 × 0.6) + (作答週數覆蓋比 × 0.4)',
        note: '範圍 0–1；QMI < 0.45 視為精熟度偏低的風險訊號。' },
      { type: 'metric', name: '風險等級（HIGH / MEDIUM / LOW）',
        desc: '依 BAS 與 QMI 門檻組合，對照訓練集歷史資料所得：',
        note: 'HIGH — BAS 低且 QMI 偏低；歷史不及格率約 33%\nMEDIUM — 部分指標偏低；歷史不及格率約 23%\nLOW — 整體表現良好；歷史不及格率約 13%' },
      { type: 'heading', text: '✅ 前瞻性驗證指標' },
      { type: 'metric', name: 'AUC — 模型區辨力',
        desc: '衡量 BAS 分數能否將「最終不及格」和「及格」的學生正確排序的能力。',
        formula: '計算方式：以 −BAS 為預測分數，對 actual_outcome（FAIL=1）做 ROC 梯形積分',
        note: '≥0.80 優良 — 能可靠地分辨高低風險\n0.70–0.79 良好 — 有效區辨，少量誤判\n0.60–0.69 尚可 — 有參考價值但需輔助判斷\n<0.60 偏低 — 區辨力不足，建議搭配人工審閱\nAUC = 0.5 代表與隨機猜測無異；1.0 代表完美區辨。' },
      { type: 'metric', name: '校準誤差（Calibration Error）',
        desc: '衡量各風險組的「預測不及格率」與「實際不及格率」的差距。',
        formula: '校準誤差 = 實際不及格率 − 歷史預測不及格率（單位：百分點 pp）',
        note: '正值（+pp）代表模型低估了該組風險（實際比預期更多人不及格）；負值（−pp）代表模型高估了風險。誤差 >±5pp 為橘紅色警示。' },
      { type: 'metric', name: '命中率（Precision）',
        desc: '各風險組中，實際不及格學生所佔的比例。',
        formula: '命中率 = 該組實際不及格人數 ÷ 該組總人數',
        note: 'HIGH 組命中率越高，代表高風險預警越精準（誤報越少）。' },
      { type: 'metric', name: '召回率（Recall）',
        desc: '全體實際不及格學生中，被 HIGH 或 MEDIUM 預警涵蓋的比例。',
        formula: '召回率 = (HIGH+MEDIUM 組中實際不及格人數) ÷ 全體實際不及格人數',
        note: '召回率越高代表「漏掉的真正高風險學生」越少；實務上召回率比命中率更重要。' },
      { type: 'metric', name: '驗證覆蓋率',
        desc: '參與驗證的學生（有期末成績）佔預警名單總人數的比例。',
        formula: '覆蓋率 = 有 actual_outcome 的人數 ÷ 預警名單總人數 × 100%',
        note: '覆蓋率越接近 100%，驗證結果越具代表性；<80% 時各項統計數值僅供參考。' },
    ],
  },

  rRadarInfo: {
    title: '📡 學習特徵雷達圖 — 分析原則',
    sections: [
      { type: 'heading', text: '圖表用途' },
      { type: 'desc', text: '比較「及格組」與「不及格組」學生在六個學習行為維度上的差異，幫助識別哪些行為與考試通過率有關。' },
      { type: 'heading', text: '六個維度說明' },
      { type: 'points', items: [
        'TXT 教材完成率：講義、文字閱讀材料的完成比例',
        'SUP 解鎖教材：需達門檻才能解鎖的補充教材（如整理筆記、動畫解析）完成比例',
        'TUT 輔導資源：課輔、解題影片等輔導類資源的使用程度',
        '考前學習強度：期末考前 7 天內的學習量佔整學期總量的比例',
        '學習穩定性：每週是否持續有學習活動（零活動週越少，穩定性分數越高）',
        'AUD 音頻時數：音檔、語音講解等聽覺教材的累積使用時間',
      ]},
      { type: 'heading', text: '數值如何計算？' },
      { type: 'desc', text: '每個維度取「該組學生的中位數原始值」，再以全體學生中位數為基準做正規化，換算到 0–100 的分數：' },
      { type: 'points', items: [
        '100 分 = 表現等同全體中位數的 2 倍（最高值）',
        '50 分 = 表現等同全體中位數（平均水準）',
        '0 分 = 幾乎未使用該資源',
      ]},
      { type: 'heading', text: '如何讀圖？' },
      { type: 'points', items: [
        '綠色區域（及格組）越大，代表及格學生在該維度投入越多。',
        '紅色區域（不及格組）縮小的維度，就是不及格學生明顯不足的行為。',
        '兩組差距越大的維度，越值得課程設計介入或預警干預。',
      ]},
      { type: 'desc', text: '點擊上方「不及格人數」或「及格人數」卡片，可單獨聚焦顯示該組雷達線。' },
    ],
  },

  r2Exclude: {
    title: '📋 排除資料說明',
    sections: [
      { type: 'desc', text: '※ 注意：AUD / VID 教材於 114-2 學期起規模性大量新增（AUD +35 件、VID +30 件），超過歷史最大單期增量的 2 倍且 ≥ 10 件。系統已自動偵測並將 AUD / VID 相關特徵排除於全體跨學期相關性計算，避免新教材導入造成比較偏差；各學期獨立相關性分析不受影響。' },
    ],
  },

  lsaHelp: {
    title: '📊 行為序列轉移圖說明',
    sections: [
      { type: 'heading', text: '📌 什麼是滯後序列分析（LSA）？' },
      { type: 'desc', text: '滯後序列分析（Lag-Sequential Analysis）用於分析行為之間的接續模式。本圖呈現學生完成某一行為後，接下來最可能執行哪種行為（Lag-1 = 緊接的下一個行為）。' },
      { type: 'heading', text: '🔢 Z-score 怎麼算？' },
      { type: 'metric', name: 'Z-score 公式',
        formula: 'Z = (觀察次數 − 期望次數) / √[期望次數 × (1−P(A)) × (1−P(B))]\n期望次數 = (A 出現總次數 × B 出現總次數) / 總序列對數',
        desc: 'Z-score >+1.96 代表 A→B 的轉移顯著多於隨機預期；Z-score <−1.96 代表顯著迴避此轉移。' },
      { type: 'heading', text: '🔵 節點（圓圈）' },
      { type: 'desc', text: '每個節點代表一種學習行為（M=教材閱讀、Q=題庫作答）。節點大小反映該行為的出現總次數。' },
      { type: 'heading', text: '➡ 邊線（箭頭）' },
      { type: 'points', items: [
        '藍色實線：顯著轉移（|Z|>1.96，p<0.05）',
        '灰色細線：不顯著轉移',
        '自環（弧形箭頭）代表連續重複相同行為。',
      ]},
      { type: 'heading', text: '👥 三組篩選' },
      { type: 'desc', text: '全體 / 及格組 / 不及格組 — 比較不同學習成效學生的行為序列差異，有助於辨識高效與低效的學習模式。' },
    ],
  },

};

// ══════════════════════════════════════════════════════════
// §0 模組樣式注入（CSP 合規：adoptedStyleSheets，無 <style> 標籤）
// 沿用專案既有慣例（參考 at-risk-report.js _injectModuleStyles()）。
// adoptedStyleSheets 屬於 JS DOM API（script-src 管轄），不觸發
// style-src 'unsafe-inline' 限制；guard 避免重複注入。
// ══════════════════════════════════════════════════════════
function _injectHelpModalStyles() {
  if (document.getElementById('__helpModalStyles')) return;

  const CSS = `
    .help-modal-overlay {
      position: fixed;
      inset: 0;
      z-index: 10000;
      background: rgba(0,0,0,0.72);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: calc(20px + env(safe-area-inset-top, 0px)) 20px calc(20px + env(safe-area-inset-bottom, 0px));
      box-sizing: border-box;
    }
    .help-modal-panel {
      width: 100%;
      box-sizing: border-box;
      background: var(--surface,#13161f);
      border: 1px solid var(--border2,#2a2f45);
      border-radius: 14px;
      padding: 24px 26px;
      color: var(--text,#dde3f5);
      font-size: .85rem;
      line-height: 1.7;
      max-height: 85vh;
      overflow-y: auto;
      overflow-wrap: anywhere;
      -webkit-overflow-scrolling: touch;
    }
    .help-modal-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .help-modal-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--accent,#3498db);
    }
    .help-modal-close {
      background: none;
      border: none;
      color: var(--text-dim,#888);
      font-size: 1.3rem;
      cursor: pointer;
      padding: 0 4px;
      line-height: 1;
    }
    .help-modal-close:hover { color: var(--text,#dde3f5); }
    .help-modal-heading {
      font-weight: 700;
      color: var(--accent,#3498db);
      margin: 14px 0 6px;
      font-size: .88rem;
    }
    .help-modal-heading:first-child { margin-top: 0; }
    .help-modal-desc {
      color: var(--text-mid,#9aa0b8);
      margin: 6px 0;
      white-space: pre-wrap;
    }
    .help-modal-points {
      margin: 6px 0 6px 18px;
      padding: 0;
      color: var(--text-mid,#9aa0b8);
      font-size: .82rem;
    }
    .help-modal-points li { margin-bottom: 4px; }
    .help-modal-use {
      margin-top: 10px;
      padding: 8px 10px;
      border-radius: 8px;
      background: var(--surface2,#1c2030);
      font-size: .8rem;
      color: var(--text-mid,#9aa0b8);
    }
    .help-modal-metric {
      border-left: 3px solid var(--accent,#3498db);
      padding-left: 10px;
      margin: 10px 0;
    }
    .help-modal-metric-name {
      font-weight: 700;
      color: var(--text,#dde3f5);
      margin-bottom: 2px;
    }
    .help-modal-metric-desc { color: var(--text-mid,#9aa0b8); }
    .help-modal-metric-formula {
      margin-top: 4px;
      padding: 6px 8px;
      border-radius: 6px;
      background: var(--surface2,#1c2030);
      font-family: monospace;
      font-size: .78rem;
      color: var(--text-mid,#9aa0b8);
      white-space: pre-wrap;
    }
    .help-modal-metric-note {
      margin-top: 4px;
      font-size: .78rem;
      color: var(--text-dim,#888);
      white-space: pre-wrap;
    }
    body.help-modal-open { overflow: hidden; }
  `;

  const guard = document.createElement('meta');
  guard.id = '__helpModalStyles';

  // 優先使用 adoptedStyleSheets（CSP 合規，無需 unsafe-inline；script-src 管轄，
  // 非 style-src，符合 CSP §0 慣例，比照 behavior-init.js 寫法）
  if (typeof CSSStyleSheet !== 'undefined' && CSSStyleSheet.prototype.replaceSync) {
    try {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(CSS);
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
      guard.setAttribute('data-csp-adopted', '1');
      document.head.appendChild(guard);
      return;
    } catch (_) { /* fallback */ }
  }
  // Fallback：nonce <style>（nonce 由 HTML CSP meta / server header 提供；
  // 目前專案未輸出 <meta name=csp-nonce>，此分支僅在極舊瀏覽器不支援
  // adoptedStyleSheets 時觸發，且僅在 style-src 仍含 unsafe-inline 時生效）
  const el = document.createElement('style');
  el.id = '__helpModalStyles';
  const nonce = document.querySelector('meta[name=csp-nonce]')?.content || '';
  if (nonce) el.setAttribute('nonce', nonce);
  el.textContent = CSS;
  document.head.appendChild(el);
}

// ══════════════════════════════════════════════════════════
// §1 統一渲染器：renderHelpModal(content)
// 全螢幕 overlay + 動態寬度 + 三重關閉機制（ESC / 點擊 overlay 外部 / ✕ 按鈕）
// 支援 sections 5 種型態：desc / points / use / heading / metric
// ══════════════════════════════════════════════════════════
function _closeHelpModal() {
  document.getElementById('helpModalOverlay')?.remove();
  document.removeEventListener('keydown', _escCloseHelpModal);
  document.body.classList.remove('help-modal-open');
}

function _escCloseHelpModal(e) {
  if (e.key === 'Escape') _closeHelpModal();
}

function renderHelpModal(content) {
  if (!content) return;
  _injectHelpModalStyles();
  // 若已開啟另一個 modal，先關閉（避免疊加多層 overlay）
  document.getElementById('helpModalOverlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'helpModalOverlay';
  overlay.className = 'help-modal-overlay';

  const panel = document.createElement('div');
  panel.className = 'help-modal-panel';
  // 依內容動態調整寬度（決策3）：含 metric 區塊（BAS/QMI/AUC/LSA 等長文說明）
  // 或區塊數量偏多（如 rRadarInfo 六維度說明，無 metric 但 sections 達 10 段）
  // 屬內容豐富型，採較寬版型；其餘（原 CHART_INFO 28 圖 + r2Exclude 等短說明）
  // 維持精簡寬度。
  const isContentRich = content.sections.some(s => s.type === 'metric')
    || content.sections.length >= 6;
  panel.style.setProperty('max-width', isContentRich ? '560px' : '400px');

  const titleRow = document.createElement('div');
  titleRow.className = 'help-modal-title-row';
  const titleSpan = document.createElement('span');
  titleSpan.className = 'help-modal-title';
  titleSpan.textContent = content.title;
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'help-modal-close';
  closeBtn.textContent = '✕';
  closeBtn.setAttribute('aria-label', '關閉');
  closeBtn.addEventListener('click', _closeHelpModal);
  titleRow.appendChild(titleSpan);
  titleRow.appendChild(closeBtn);
  panel.appendChild(titleRow);

  content.sections.forEach(sec => {
    if (sec.type === 'desc') {
      const p = document.createElement('div');
      p.className = 'help-modal-desc';
      p.textContent = sec.text;
      panel.appendChild(p);

    } else if (sec.type === 'heading') {
      const h = document.createElement('div');
      h.className = 'help-modal-heading';
      h.textContent = sec.text;
      panel.appendChild(h);

    } else if (sec.type === 'points') {
      const ul = document.createElement('ul');
      ul.className = 'help-modal-points';
      sec.items.forEach(it => {
        const li = document.createElement('li');
        li.textContent = it;
        ul.appendChild(li);
      });
      panel.appendChild(ul);

    } else if (sec.type === 'use') {
      const div = document.createElement('div');
      div.className = 'help-modal-use';
      div.textContent = '💡 ' + sec.text;
      panel.appendChild(div);

    } else if (sec.type === 'metric') {
      const div = document.createElement('div');
      div.className = 'help-modal-metric';

      const name = document.createElement('div');
      name.className = 'help-modal-metric-name';
      name.textContent = sec.name;
      div.appendChild(name);

      // formula 缺席時自然省略該區塊，不留空白（v5 §4 待確認事項）
      if (sec.desc) {
        const d = document.createElement('div');
        d.className = 'help-modal-metric-desc';
        d.textContent = sec.desc;
        div.appendChild(d);
      }
      if (sec.formula) {
        const f = document.createElement('div');
        f.className = 'help-modal-metric-formula';
        f.textContent = sec.formula;
        div.appendChild(f);
      }
      if (sec.note) {
        // note 內的 \n 換行：white-space:pre-wrap（CSS）+ textContent 原生支援，
        // 不需手動轉 <br>（v5 §4 待確認事項）
        const n = document.createElement('div');
        n.className = 'help-modal-metric-note';
        n.textContent = sec.note;
        div.appendChild(n);
      }
      panel.appendChild(div);
    }
  });

  overlay.appendChild(panel);
  // 三重關閉機制之一：點擊 overlay 外部（面板以外區域）
  overlay.addEventListener('click', e => { if (e.target === overlay) _closeHelpModal(); });
  document.body.appendChild(overlay);
  // 鎖定背景頁面捲動（比照 main.js chart-expanded-open 慣例），避免 iOS PWA
  // 全螢幕模式下 touchmove 造成背景橡皮筋捲動
  document.body.classList.add('help-modal-open');
  // 三重關閉機制之二：ESC
  document.addEventListener('keydown', _escCloseHelpModal);
}

// ══════════════════════════════════════════════════════════
// §2 attachHelpButtons() — 取代 main.js attachInfoButtons()
// 【B1/B9】main.js 原 attachInfoButtons() 為 CHART_INFO 28 個圖表建立
// hover popover 按鈕；v4 決策1（hover 全面改 click modal）要求此機制比照
// 5 個手寫面板一併改為呼叫 renderHelpModal()。v4/v5 規劃書未明列此函式的
// 具體實作，此為依決策1必要的補完（詳見隨附交付說明）。
// 呼叫點（main.js×3、behavior-init.js×2）已同步由 attachInfoButtons()
// 改名為 attachHelpButtons()。
// ══════════════════════════════════════════════════════════
const _HELP_MODAL_STANDALONE_KEYS = ['bStatsHelp', 'warningHelp', 'rRadarInfo', 'r2Exclude', 'lsaHelp'];

function attachHelpButtons() {
  Object.keys(HELP_CONTENT).forEach(id => {
    if (_HELP_MODAL_STANDALONE_KEYS.includes(id)) return; // 5 個手寫面板由專屬觸發點呼叫，非此處理

    const content = HELP_CONTENT[id];
    // getElementById 對 <canvas> 與 <div> wrap 元素查找方式相同，故僅需單一查找
    // （移除重構過程殘留的重複 else 分支：原寫法會對同一 id 再查一次 getElementById，
    // 條件必為 false，屬無法觸發的死碼）
    const el = document.getElementById(id);
    const titleEl = el?.closest('.chart-card')?.querySelector('.chart-title');
    if (!titleEl) return;
    // 沿用原 attachInfoButtons() 的清理邏輯，避免重複呼叫時按鈕疊加
    titleEl.querySelector('.chart-info-btn')?.remove();

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chart-info-btn';
    btn.textContent = '?';
    btn.setAttribute('aria-label', `${content.title} 說明`);
    btn.title = content.title;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      renderHelpModal(content);
    });

    chartTitleActions(titleEl).appendChild(btn);
  });
}

// ══════════════════════════════════════════════════════════
// §3 向下相容殼層（v4 §4.3，3 個 window.* + 1 個 r2Exclude click binding）
// main.js 的 actionMap 呼叫 window.toggleBStatsHelp / window.toggleRRadarInfo /
// window.toggleWarningHelp（維持不變，見 main.js §STOP_PROPAGATION_ACTIONS 區塊）。
// ══════════════════════════════════════════════════════════
window.toggleBStatsHelp  = () => renderHelpModal(HELP_CONTENT.bStatsHelp);
window.toggleRRadarInfo  = () => renderHelpModal(HELP_CONTENT.rRadarInfo);
window.toggleWarningHelp = () => renderHelpModal(HELP_CONTENT.warningHelp);

// r2ExcludeInfoBtn 無 data-action，原本靠 ui-toggles.js 的 document click
// ID 比對觸發（B3）；ui-toggles.js 整檔移除後於此自行綁定。
//
// 【B8】corrInfoToggleBtn 摺疊邏輯（原 ui-toggles.js L114-123）與 help modal
// 無關、不屬本次遷移範圍（22-1 v4 checklist 已確認排除），但因其唯一容器
// ui-toggles.js 整檔移除，邏輯原封不動搬遷至此以避免功能中斷，非新增行為。
document.addEventListener('click', (e) => {
  if (e.target.closest('#r2ExcludeInfoBtn')) {
    renderHelpModal(HELP_CONTENT.r2Exclude);
    return;
  }

  if (e.target.closest('#corrInfoToggleBtn')) {
    const body = document.getElementById('corrInfoBody');
    const icon = document.getElementById('corrInfoIcon');
    if (!body) return;
    const open = body.style.display !== 'none';
    body.style.setProperty('display', open ? 'none' : 'block');
    if (icon) icon.textContent = open ? '▶' : '▼';
  }
});
