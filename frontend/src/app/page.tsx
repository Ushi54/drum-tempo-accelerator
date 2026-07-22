'use client';

import React, { useState, useEffect, useRef } from "react";

interface Preset {
  id: string;
  name: string;
  startBpm: number;
  maxBpm: number;
  accInterval: number;
  accAmount: number;
  accMode?: "bars" | "time";
}

interface User {
  id: string;
  email: string;
}

const getApiBaseUrl = () => {
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:8080/api`;
  }
  return "http://localhost:8080/api";
};
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || getApiBaseUrl();

export default function Home() {
  // --- React State ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [activeBeat, setActiveBeat] = useState(-1);
  const [ringPulseClass, setRingPulseClass] = useState("");
  const [autoAccelerate, setAutoAccelerate] = useState(false);

  // Accelerator parameters
  const [startBpm, setStartBpm] = useState<number | "">(100);
  const [maxBpm, setMaxBpm] = useState<number | "">(160);
  const [accInterval, setAccInterval] = useState<number | "">(4);
  const [accAmount, setAccAmount] = useState<number | "">(5);
  const [accMode, setAccMode] = useState<"bars" | "time">("bars");

  // Auth / Presets State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [presetsList, setPresetsList] = useState<Preset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [presetInfo, setPresetInfo] = useState("");
  const [statusBarHTML, setStatusBarHTML] = useState("標準メトロノームモード");

  // Modals
  const [achievementModalOpen, setAchievementModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirmPassword, setAuthConfirmPassword] = useState("");
  const [authErrorMsg, setAuthErrorMsg] = useState("");
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState("加速練習メニュー");
  const [presetListModalOpen, setPresetListModalOpen] = useState(false);
  const [saveErrorMsg, setSaveErrorMsg] = useState("");

  // Custom Alert / Confirm Modal State
  const [customModal, setCustomModal] = useState<{
    isOpen: boolean;
    type: "alert" | "confirm";
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: "alert",
    title: "",
    message: "",
  });

  const showAlert = (message: string, title: string = "警告") => {
    setCustomModal({
      isOpen: true,
      type: "alert",
      title,
      message,
    });
  };

  const showConfirm = (message: string, onConfirm: () => void, title: string = "確認") => {
    setCustomModal({
      isOpen: true,
      type: "confirm",
      title,
      message,
      onConfirm,
    });
  };

  // --- Scheduler & Audio Engine Refs ---
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerIDRef = useRef<NodeJS.Timeout | null>(null);
  const nextNoteTimeRef = useRef(0.0);
  const currentBeatRef = useRef(0);
  const measureCountRef = useRef(0);
  const notesInQueueRef = useRef<Array<{ note: number; time: number }>>([]);
  const animationFrameRef = useRef<number | null>(null);

  // Focus Ref for preset save modal
  const saveInputRef = useRef<HTMLInputElement>(null);

  const isPlayingRef = useRef(false);

  // Sync state values to refs for the scheduler async loop
  const bpmRef = useRef(bpm);
  const autoAccelerateRef = useRef(autoAccelerate);
  const startBpmRef = useRef<number>(Number(startBpm) || 100);
  const maxBpmRef = useRef<number>(Number(maxBpm) || 160);
  const accIntervalRef = useRef<number>(Number(accInterval) || 4);
  const accAmountRef = useRef<number>(Number(accAmount) || 5);
  const accModeRef = useRef<"bars" | "time">(accMode);

  // For time-based acceleration
  const sessionStartTimeRef = useRef(0.0);
  const accelerationCountRef = useRef(0);

  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { accModeRef.current = accMode; }, [accMode]);
  useEffect(() => { autoAccelerateRef.current = autoAccelerate; }, [autoAccelerate]);
  useEffect(() => { startBpmRef.current = Number(startBpm) || 30; }, [startBpm]);
  useEffect(() => { maxBpmRef.current = Number(maxBpm) || 160; }, [maxBpm]);
  useEffect(() => { accIntervalRef.current = Number(accInterval) || 4; }, [accInterval]);
  useEffect(() => { accAmountRef.current = Number(accAmount) || 5; }, [accAmount]);

  // Auto-focus when save preset modal opens
  useEffect(() => {
    if (saveModalOpen) {
      const timer = setTimeout(() => {
        if (saveInputRef.current) {
          saveInputRef.current.focus();
          saveInputRef.current.select();
        }
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [saveModalOpen]);

  const beatsPerMeasure = 4;
  const lookahead = 25.0; // ms
  const scheduleAheadTime = 0.1; // seconds

  // --- Audio Logic ---
  const nextNote = () => {
    const secondsPerBeat = 60.0 / bpmRef.current;
    nextNoteTimeRef.current += secondsPerBeat;

    currentBeatRef.current = (currentBeatRef.current + 1) % beatsPerMeasure;

    if (currentBeatRef.current === 0) {
      measureCountRef.current++;

      if (autoAccelerateRef.current) {
        let shouldAccelerate = false;
        if (accModeRef.current === "bars") {
          shouldAccelerate = measureCountRef.current > 0 && measureCountRef.current % accIntervalRef.current === 0;
        } else {
          // Time-based acceleration
          const currentTime = nextNoteTimeRef.current - sessionStartTimeRef.current;
          if (currentTime > (accelerationCountRef.current + 1) * accIntervalRef.current) {
            shouldAccelerate = true;
            accelerationCountRef.current++;
          }
        }

        if (shouldAccelerate) {
          if (bpmRef.current < maxBpmRef.current) {
            const oldBpm = bpmRef.current;
            const nextBpm = Math.min(maxBpmRef.current, bpmRef.current + accAmountRef.current);
            bpmRef.current = nextBpm;

            // Smooth state updates
            setBpm(nextBpm);
            setStatusBarHTML(`テンポアップ！ <span>${oldBpm} ➔ ${nextBpm} BPM</span>`);
            setRingPulseClass("active-accent-1");
            setTimeout(() => setRingPulseClass(""), 150);
          } else {
            // Target BPM reached
            stopSession();
            setStatusBarHTML(`🎉 <span>目標達成！お疲れ様でした！</span>`);
            setAchievementModalOpen(true);
          }
        }
      }
    }
  };

  const scheduleNote = (beatNumber: number, time: number) => {
    if (!audioCtxRef.current) return;
    notesInQueueRef.current.push({ note: beatNumber, time });

    const osc = audioCtxRef.current.createOscillator();
    const gainNode = audioCtxRef.current.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtxRef.current.destination);

    if (beatNumber === 0) {
      osc.frequency.setValueAtTime(1200, time); // High click
    } else {
      osc.frequency.setValueAtTime(800, time); // Normal click
    }

    gainNode.gain.setValueAtTime(1.0, time);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.start(time);
    osc.stop(time + 0.06);
  };

  const scheduler = () => {
    if (!audioCtxRef.current || !isPlayingRef.current) return;
    while (nextNoteTimeRef.current < audioCtxRef.current.currentTime + scheduleAheadTime) {
      scheduleNote(currentBeatRef.current, nextNoteTimeRef.current);
      nextNote();
      if (!isPlayingRef.current) return;
    }
    timerIDRef.current = setTimeout(scheduler, lookahead);
  };

  const draw = () => {
    if (!audioCtxRef.current) return;
    const currentTime = audioCtxRef.current.currentTime;

    while (notesInQueueRef.current.length && notesInQueueRef.current[0].time < currentTime) {
      const activeBeatInfo = notesInQueueRef.current.shift();
      if (activeBeatInfo) {
        const beatNum = activeBeatInfo.note;
        setActiveBeat(beatNum);

        if (beatNum === 0) {
          setRingPulseClass("active-accent-1");
          setTimeout(() => {
            setRingPulseClass("");
          }, 120);
        } else {
          setRingPulseClass("active-accent-other");
          setTimeout(() => {
            setRingPulseClass("");
          }, 80);
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(draw);
  };

  // --- Session Control ---
  const startSession = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }

      setIsPlaying(true);
      isPlayingRef.current = true;
      currentBeatRef.current = 0;
      measureCountRef.current = 0;
      notesInQueueRef.current = [];
      sessionStartTimeRef.current = audioCtxRef.current.currentTime;
      accelerationCountRef.current = 0;

      if (autoAccelerateRef.current) {
        const startingBpm = startBpmRef.current;
        setBpm(startingBpm);
        bpmRef.current = startingBpm;
        setStatusBarHTML(`加速セッション開始: <span>${startingBpm} BPM</span>`);
      } else {
        setStatusBarHTML("標準メトロノームセッション");
      }

      nextNoteTimeRef.current = audioCtxRef.current.currentTime + 0.05;
      scheduler();
      animationFrameRef.current = requestAnimationFrame(draw);
    } catch (e: any) {
      window.alert("startSession Error: " + e.message + "\nStack: " + e.stack);
    }
  };

  const stopSession = () => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    if (timerIDRef.current) {
      clearTimeout(timerIDRef.current);
      timerIDRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setActiveBeat(-1);
    setRingPulseClass("");
    notesInQueueRef.current = [];
  };

  const handlePlayBtnClick = () => {
    try {
      if (isPlaying) {
        stopSession();
        setStatusBarHTML(autoAccelerate ? `加速モード準備完了: ${startBpm}BPM ➔ ${maxBpm}BPM` : "標準メトロノームモード");
      } else {
        startSession();
      }
    } catch (e: any) {
      window.alert("Play Error: " + e.message + "\nStack: " + e.stack);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIDRef.current) clearTimeout(timerIDRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // --- React UI Handlers ---
  const handleBpmSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!autoAccelerate) {
      const val = parseInt(e.target.value);
      setBpm(val);
      bpmRef.current = val;
    }
  };

  const handleBpmInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!autoAccelerate) {
      const val = parseInt(e.target.value);
      if (!isNaN(val)) {
        const applyBpm = Math.max(1, Math.min(300, val));
        setBpm(val);
        bpmRef.current = applyBpm;
      } else {
        setBpm(0);
      }
    }
  };

  const handleBpmInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value);
    if (isNaN(val) || val < 30) {
      val = 30;
    } else if (val > 300) {
      val = 300;
    }
    setBpm(val);
    bpmRef.current = val;
  };

  const handleAutoAccToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setAutoAccelerate(checked);
    if (checked) {
      setStatusBarHTML(`加速モード準備完了: ${startBpm}BPM ➔ ${maxBpm}BPM`);
    } else {
      setStatusBarHTML("標準メトロノームモード");
    }
  };

  // --- Auth logic ---
  useEffect(() => {
    const storedId = localStorage.getItem("drum_user_id");
    const storedEmail = localStorage.getItem("drum_user_email");
    if (storedId && storedEmail) {
      setCurrentUser({ id: storedId, email: storedEmail });
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadPresets(currentUser.id);
    } else {
      setPresetsList([]);
      setSelectedPresetId("");
    }
  }, [currentUser]);

  const loadPresets = async (userId: string) => {
    setPresetInfo("読込中...");
    try {
      const response = await fetch(`${API_BASE_URL}/presets?userId=${userId}`);
      if (!response.ok) throw new Error("プリセット取得に失敗しました。");
      const data = await response.json();
      setPresetsList(data);
      setPresetInfo("");
    } catch (e) {
      console.error(e);
      setPresetInfo("エラー");
    }
  };

  const handleLogout = () => {
    if (isPlaying) stopSession();
    setCurrentUser(null);
    localStorage.removeItem("drum_user_id");
    localStorage.removeItem("drum_user_email");
    setStatusBarHTML("ログアウトしました。");
  };

  const openAuthFlow = () => {
    setAuthErrorMsg("");
    setAuthEmail("");
    setAuthPassword("");
    setAuthConfirmPassword("");
    setAuthMode("login");
    setAuthModalOpen(true);
  };

  const handleAuthSubmit = async () => {
    const email = authEmail.trim();
    const password = authPassword.trim();

    if (!email || !password) {
      setAuthErrorMsg("メールアドレスとパスワードを入力してください。");
      return;
    }

    if (authMode === "signup" && password !== authConfirmPassword) {
      setAuthErrorMsg("パスワードと確認用パスワードが一致しません。");
      return;
    }

    setAuthErrorMsg("送信中...");
    const endpoint = authMode === "login" ? "/auth/login" : "/auth/signup";

    try {
      const response = await fetch(API_BASE_URL + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "認証に失敗しました。");
      }

      setCurrentUser({ id: data.id, email: data.email });
      localStorage.setItem("drum_user_id", data.id);
      localStorage.setItem("drum_user_email", data.email);
      setAuthModalOpen(false);
      setStatusBarHTML(data.message || "ログインしました。");
    } catch (e: any) {
      setAuthErrorMsg(e.message || "エラーが発生しました。");
    }
  };

  const handlePresetSelect = (selectedId: string) => {
    setSelectedPresetId(selectedId);
    if (!selectedId) return;

    // プリセット適用時にメトロノームを停止
    stopSession();

    const preset = presetsList.find((p) => p.id === selectedId);
    if (preset) {
      setStartBpm(preset.startBpm);
      setMaxBpm(preset.maxBpm);
      setAccInterval(preset.accInterval);
      setAccAmount(preset.accAmount);
      if (preset.accMode) {
        setAccMode(preset.accMode);
      } else {
        setAccMode("bars");
      }

      // 停止したため、BPM値をプリセットの初期値に更新
      setBpm(preset.startBpm);
      bpmRef.current = preset.startBpm;
      setStatusBarHTML(`プリセット「${preset.name}」を適用しました`);
    }
    setPresetListModalOpen(false);
  };

  const handleSavePresetClick = () => {
    if (!currentUser) return;
    setNewPresetName("加速練習メニュー");
    setSaveErrorMsg("");
    setSaveModalOpen(true);
  };

  const handleSavePresetSubmit = async () => {
    if (!currentUser) return;
    const name = newPresetName.trim();
    if (!name) {
      setSaveErrorMsg("プリセットの名前を入力してください。");
      return;
    }
    if (name.length > 20) {
      setSaveErrorMsg("プリセット名は20文字以内で入力してください。");
      return;
    }

    // 重複チェック
    const isDuplicate = presetsList.some(
      (p) => p.name.trim() === name
    );
    if (isDuplicate) {
      setSaveErrorMsg("同じ名前のプリセットが既に存在します。");
      return;
    }

    setPresetInfo("保存中...");
    setSaveModalOpen(false);

    try {
      const response = await fetch(`${API_BASE_URL}/presets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          name,
          startBpm,
          maxBpm,
          accInterval,
          accAmount,
          accMode,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "保存に失敗しました。");

      setStatusBarHTML(data.message || "保存しました。");
      await loadPresets(currentUser.id);
      setSelectedPresetId(data.id);
    } catch (e: any) {
      showAlert(e.message || "エラーが発生しました。");
      setPresetInfo("失敗");
    }
  };

  const handleDeletePreset = async (presetId: string, presetName: string) => {
    if (!currentUser) return;

    showConfirm(`プリセット「${presetName}」を削除してもよろしいですか？`, async () => {
      setPresetInfo("削除中...");

      try {
        const response = await fetch(`${API_BASE_URL}/presets/${presetId}`, {
          method: "DELETE",
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "削除に失敗しました。");

        setStatusBarHTML(data.message || "削除しました。");
        if (selectedPresetId === presetId) {
          setSelectedPresetId("");
        }
        await loadPresets(currentUser.id);
      } catch (e: any) {
        showAlert(e.message || "エラーが発生しました。");
        setPresetInfo("失敗");
      }
    });
  };

  return (
    <div className="container">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
        <h1>DRUM TEMPO ACCELERATOR</h1>
        <div id="authHeader" style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "8px" }}>
          {currentUser ? (
            <>
              <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", textOverflow: "ellipsis", overflow: "hidden", maxWidth: "100px", whiteSpace: "nowrap" }}>
                {currentUser.email}
              </span>
              <button id="logoutBtn" onClick={handleLogout} style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#ef4444", borderRadius: "8px", padding: "4px 8px", fontSize: "0.7rem", fontWeight: 600, cursor: "pointer" }}>
                OUT
              </button>
            </>
          ) : (
            <button id="authTriggerBtn" onClick={openAuthFlow} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid var(--border-color)", color: "var(--text-main)", borderRadius: "8px", padding: "4px 10px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>
              ログイン
            </button>
          )}
        </div>
      </header>

      <div className="display-section">
        <div className={`bpm-ring-outer ${ringPulseClass}`} id="bpmRing">
          <input
            type="number"
            className="bpm-number-input"
            id="bpmValInput"
            value={bpm === 0 ? "" : bpm}
            disabled={autoAccelerate}
            onChange={handleBpmInputChange}
            onBlur={handleBpmInputBlur}
            min="30"
            max="300"
          />
          <div className="bpm-label">BPM</div>
        </div>

        <div className="beat-indicators">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`dot ${activeBeat === index ? (index === 0 ? "active-beat-1" : "active-beat-other") : ""}`}
              id={`dot-${index}`}
            />
          ))}
        </div>
      </div>

      <div className="bpm-slider-container">
        <div className="bpm-slider-header">
          <span>SLOW</span>
          <span id="sliderBpmDisplay">{bpm} BPM</span>
          <span>FAST</span>
        </div>
        <input
          type="range"
          min="30"
          max="300"
          value={bpm}
          className="slider-input"
          id="bpmSlider"
          disabled={autoAccelerate}
          onChange={handleBpmSliderChange}
        />
      </div>

      <div className="controls-panel">
        <div className="panel-row">
          <div className="label-group">
            <span className="field-title">自動テンポ加速 (小節ベース)</span>
            <span className="field-desc">指定した小節ごとにテンポを上げます</span>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={autoAccelerate && accMode === "bars"}
              onChange={(e) => {
                if (isPlaying) stopSession();
                if (e.target.checked) {
                  setAccMode("bars");
                  setAutoAccelerate(true);
                } else {
                  setAutoAccelerate(false);
                }
              }}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="panel-row">
          <div className="label-group">
            <span className="field-title">自動テンポ加速 (時間ベース) ⏱️</span>
            <span className="field-desc">指定した秒数ごとにテンポを上げます</span>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={autoAccelerate && accMode === "time"}
              onChange={(e) => {
                if (isPlaying) stopSession();
                if (e.target.checked) {
                  setAccMode("time");
                  setAutoAccelerate(true);
                  if (!currentUser) setAccInterval(10);
                } else {
                  setAutoAccelerate(false);
                }
              }}
            />
            <span className="slider"></span>
          </label>
        </div>

        {autoAccelerate && (
          currentUser ? (
            <div id="presetArea" style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)" }}>プリセット選択</label>
                <span id="presetInfo" style={{ fontSize: "0.7rem", color: "var(--accent-secondary)" }}>{presetInfo}</span>
              </div>
              <button
                type="button"
                onClick={() => setPresetListModalOpen(true)}
                style={{
                  width: "100%",
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  color: "var(--text-main)",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <span>
                  {selectedPresetId
                    ? presetsList.find(p => p.id === selectedPresetId)?.name || "-- 選択してください --"
                    : "-- 選択してください --"
                  }
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>▼</span>
              </button>
            </div>
          ) : (
            <div id="presetPrompt" style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.05)", textAlign: "center", fontSize: "0.7rem", color: "var(--text-muted)" }}>
              💡 ログインすると設定のプリセット保存機能が使えます。
            </div>
          )
        )}

        <div className={`param-inputs ${autoAccelerate ? "expanded" : ""}`} id="accParams">
          {accMode === "time" && !currentUser && (
            <div style={{ fontSize: "0.7rem", color: "var(--accent-secondary)", textAlign: "center", marginBottom: "8px" }}>
              🔒 無料版は10秒固定です（有料版で自由に設定可能）
            </div>
          )}

          <div className="grid-inputs" style={{ gridTemplateColumns: "1fr auto 1fr", gap: "6px", alignItems: "center", marginTop: "5px" }}>
            <div className="input-box">
              <label htmlFor="startBpm">開始 BPM</label>
              <input
                type="number"
                id="startBpm"
                min="30"
                max="300"
                value={startBpm}
                onChange={(e) => setStartBpm(e.target.value === "" ? "" : Number(e.target.value))}
                onBlur={() => {
                  let val = Number(startBpm);
                  if (isNaN(val) || val < 30) val = 30;
                  if (val > 300) val = 300;
                  setStartBpm(val);
                }}
              />
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: "1rem", marginTop: "14px", fontWeight: "bold" }}>➔</div>
            <div className="input-box">
              <label htmlFor="maxBpm">目標(限界) BPM</label>
              <input
                type="number"
                id="maxBpm"
                min="30"
                max="300"
                value={maxBpm}
                onChange={(e) => setMaxBpm(e.target.value === "" ? "" : Number(e.target.value))}
                onBlur={() => {
                  let val = Number(maxBpm);
                  if (isNaN(val) || val < 30) val = 30;
                  if (val > 300) val = 300;
                  setMaxBpm(val);
                }}
              />
            </div>
            <div className="input-box">
              <label htmlFor="accInterval">
                {accMode === "bars" ? "加速間隔 (小節数)" : "加速間隔 (秒数)"}
              </label>
              <input
                type="number"
                id="accInterval"
                min="1"
                max={accMode === "time" ? 300 : 100}
                value={accInterval}
                disabled={accMode === "time" && !currentUser}
                onChange={(e) => setAccInterval(e.target.value === "" ? "" : Number(e.target.value))}
                onBlur={() => {
                  let val = Number(accInterval);
                  if (isNaN(val) || val < 1) val = accMode === "bars" ? 4 : 10;
                  const maxLimit = accMode === "time" ? 300 : 100;
                  if (val > maxLimit) val = maxLimit;
                  
                  // 無料版の時間モード制限
                  if (accMode === "time" && !currentUser) val = 10;
                  
                  setAccInterval(val);
                }}
              />
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: "1rem", marginTop: "14px", fontWeight: "bold" }}>➔</div>
            <div className="input-box">
              <label htmlFor="accAmount">加速量 (+BPM)</label>
              <input
                type="number"
                id="accAmount"
                min="1"
                max="50"
                value={accAmount}
                onChange={(e) => setAccAmount(e.target.value === "" ? "" : Number(e.target.value))}
                onBlur={() => {
                  let val = Number(accAmount);
                  if (isNaN(val) || val < 1) val = 5;
                  if (val > 50) val = 50;
                  setAccAmount(val);
                }}
              />
            </div>
          </div>

          {currentUser && (
            <div style={{ marginTop: "12px" }}>
              <button id="savePresetBtn" onClick={handleSavePresetClick} style={{ width: "100%", background: "var(--accent-primary)", border: "none", color: "#2a2f22", fontWeight: 800, borderRadius: "8px", padding: "8px", fontSize: "0.8rem", cursor: "pointer" }}>設定を保存</button>
            </div>
          )}
        </div>
      </div>

      <button className={`play-btn ${isPlaying ? "playing" : ""}`} id="playBtn" onClick={handlePlayBtnClick}>
        {isPlaying ? (
          <>
            <svg className="stop-icon" id="stopIcon" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
            <span id="btnText">STOP SESSION</span>
          </>
        ) : (
          <>
            <svg className="play-icon" id="playIcon" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            <span id="btnText">START SESSION</span>
          </>
        )}
      </button>

      <div className="status-bar" id="statusBar" dangerouslySetInnerHTML={{ __html: statusBarHTML }} />

      {/* Achievement Modal */}
      <div className={`modal-overlay ${achievementModalOpen ? "show" : ""}`} id="achievementModal">
        <div className="modal-card">
          <div className="modal-icon">🏆</div>
          <h2 className="modal-title">目標達成！</h2>
          <p className="modal-message">お疲れ様でした！<br />目標の <span>{maxBpm}</span> BPM に到達しました！</p>
          <button className="modal-btn" id="modalCloseBtn" onClick={() => setAchievementModalOpen(false)}>閉じる</button>
        </div>
      </div>

      {/* Auth Modal */}
      <div className={`modal-overlay ${authModalOpen ? "show" : ""}`} id="authModal">
        <div className="modal-card" style={{ maxWidth: "360px" }}>
          <h2 className="modal-title" id="authModalTitle">{authMode === "login" ? "ログイン" : "新規登録"}</h2>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "20px", textAlign: "center" }}>
            個人アカウントでログインしてプリセットを保存します
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", textAlign: "left", marginBottom: "20px" }}>
            <div className="input-box">
              <label htmlFor="authEmail">メールアドレス</label>
              <input type="email" id="authEmail" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="user@example.com" style={{ width: "100%" }} />
            </div>
            <div className="input-box">
              <label htmlFor="authPassword">パスワード</label>
              <input type="password" id="authPassword" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="••••••••" style={{ width: "100%" }} />
            </div>
            {authMode === "signup" && (
              <div className="input-box">
                <label htmlFor="authConfirmPassword">パスワード (確認用)</label>
                <input type="password" id="authConfirmPassword" value={authConfirmPassword} onChange={(e) => setAuthConfirmPassword(e.target.value)} placeholder="••••••••" style={{ width: "100%" }} />
              </div>
            )}
          </div>

          <button className="modal-btn" id="authSubmitBtn" onClick={handleAuthSubmit} style={{ marginBottom: "12px" }}>
            {authMode === "login" ? "ログイン" : "新規登録"}
          </button>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)" }}>
            <span
              id="authSwitchModeBtn"
              onClick={() => {
                setAuthMode(authMode === "login" ? "signup" : "login");
                setAuthErrorMsg("");
                setAuthConfirmPassword("");
              }}
              style={{ cursor: "pointer", textDecoration: "underline", color: "var(--accent-secondary)" }}
            >
              {authMode === "login" ? "新規アカウント登録はこちら" : "ログインはこちら"}
            </span>
            <span id="authCancelBtn" onClick={() => setAuthModalOpen(false)} style={{ cursor: "pointer", textDecoration: "underline" }}>
              キャンセル
            </span>
          </div>

          <div id="authErrorMsg" style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "15px", textAlign: "center", minHeight: "15px" }}>
            {authErrorMsg}
          </div>
        </div>
      </div>

      {/* Save Preset Modal */}
      <div className={`modal-overlay ${saveModalOpen ? "show" : ""}`} id="savePresetModal">
        <div className="modal-card" style={{ maxWidth: "360px" }}>
          <h2 className="modal-title">プリセットの保存</h2>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "20px", textAlign: "center" }}>
            現在の練習メニューの設定に名前をつけて保存します
          </p>

          {/* 設定サマリー表示 */}
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--border-color)",
            borderRadius: "8px",
            padding: "10px 12px",
            marginBottom: "16px",
            fontSize: "0.75rem",
            textAlign: "left",
            display: "flex",
            flexDirection: "column",
            gap: "6px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>テンポ範囲:</span>
              <span style={{ fontWeight: 700, color: "var(--accent-secondary)" }}>{startBpm} BPM ➔ {maxBpm} BPM</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>加速ルール:</span>
              <span style={{ fontWeight: 600 }}>{accInterval} 小節ごとに +{accAmount} BPM</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", textAlign: "left", marginBottom: "20px" }}>
            <div className="input-box">
              <label htmlFor="newPresetName">プリセット名</label>
              <input type="text" id="newPresetName" ref={saveInputRef} value={newPresetName} onChange={(e) => { setNewPresetName(e.target.value); setSaveErrorMsg(""); }} placeholder="例：加速練習メニュー" style={{ width: "100%" }} maxLength={20} />
              {saveErrorMsg && (
                <div style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "6px", textAlign: "left", minHeight: "15px" }}>
                  {saveErrorMsg}
                </div>
              )}
            </div>
          </div>

          <button className="modal-btn" id="savePresetSubmitBtn" onClick={handleSavePresetSubmit} style={{ marginBottom: "12px" }}>
            保存する
          </button>
          <button className="modal-btn" id="savePresetCancelBtn" onClick={() => setSaveModalOpen(false)} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid var(--border-color)", color: "var(--text-main)", fontWeight: 700, width: "100%" }}>
            キャンセル
          </button>
        </div>
      </div>

      {/* Preset List Modal */}
      <div className={`modal-overlay ${presetListModalOpen ? "show" : ""}`} id="presetListModal">
        <div className="modal-card" style={{ maxWidth: "380px" }}>
          <h2 className="modal-title">プリセットの選択</h2>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "20px", textAlign: "center" }}>
            保存された練習メニューを選択、または削除します
          </p>

          <div className="no-scrollbar" style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "240px", overflowY: "auto", marginBottom: "20px" }}>
            {presetsList.length === 0 ? (
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "center", padding: "20px" }}>
                保存されたプリセットがありません
              </div>
            ) : (
              presetsList.map((p) => (
                <div key={p.id} className="preset-list-item" onClick={() => handlePresetSelect(p.id)}>
                  <div style={{ flex: 1, textAlign: "left", display: "flex", flexDirection: "column", gap: "2px", overflow: "hidden" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.name}>
                      {p.name}
                    </span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center", fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px" }}>
                      <span>BPM: <strong style={{ color: "var(--accent-secondary)" }}>{p.startBpm}</strong> ➔ <strong style={{ color: "var(--accent-primary)" }}>{p.maxBpm}</strong></span>
                      <span style={{ opacity: 0.3 }}>|</span>
                      <span>{p.accInterval}小節ごとに +{p.accAmount}BPM</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePreset(p.id, p.name);
                      }}
                      style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#ef4444", borderRadius: "6px", padding: "6px 10px", fontSize: "0.75rem", cursor: "pointer" }}
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <button className="modal-btn" id="presetListCancelBtn" onClick={() => setPresetListModalOpen(false)} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid var(--border-color)", color: "var(--text-main)", fontWeight: 700, width: "100%" }}>
            キャンセル
          </button>
        </div>
      </div>

      {/* Custom Alert/Confirm Modal */}
      <div className={`modal-overlay ${customModal.isOpen ? "show" : ""}`} id="customPromptModal">
        <div className="modal-card" style={{ maxWidth: "360px" }}>
          <h2 className="modal-title">{customModal.title}</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-main)", marginBottom: "20px", textAlign: "center", lineHeight: "1.5" }}>
            {customModal.message}
          </p>

          <div style={{ display: "flex", gap: "10px", width: "100%" }}>
            {customModal.type === "confirm" && (
              <button
                className="modal-btn"
                onClick={() => setCustomModal(prev => ({ ...prev, isOpen: false }))}
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid var(--border-color)", color: "var(--text-main)", fontWeight: 700, flex: 1 }}
              >
                キャンセル
              </button>
            )}
            <button
              className="modal-btn"
              onClick={() => {
                setCustomModal(prev => ({ ...prev, isOpen: false }));
                if (customModal.type === "confirm" && customModal.onConfirm) {
                  customModal.onConfirm();
                }
              }}
              style={{ flex: 1 }}
            >
              {customModal.type === "confirm" ? "実行" : "OK"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
// Force Vercel redeploy 2
