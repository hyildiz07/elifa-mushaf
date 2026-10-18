(() => {
  // src/study-settings.mjs
  var object = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
  function validStudySettings(v) {
    return object(v) && Object.keys(v).every((k) => ["reciter", "speed", "rep", "repOn", "wait", "mode", "splitCombine", "combineRep", "rangeRep"].includes(k)) && ["reciter", "speed", "rep", "repOn", "wait", "mode", "splitCombine"].every((k) => Object.hasOwn(v, k)) && Number.isInteger(v.reciter) && v.reciter > 0 && v.reciter <= 1e3 && Number.isFinite(v.speed) && v.speed >= 0.5 && v.speed <= 2 && Number.isInteger(v.rep) && v.rep >= 1 && v.rep <= 99 && typeof v.repOn === "boolean" && Number.isFinite(v.wait) && v.wait >= 0 && v.wait <= 60 && ["range", "verse", "cumulative"].includes(v.mode) && typeof v.splitCombine === "boolean" && ["combineRep", "rangeRep"].every((k) => v[k] === void 0 || Number.isInteger(v[k]) && v[k] >= 0 && v[k] <= 99);
  }
  function validStudyProgress(v, from, to) {
    return object(v) && Object.keys(v).every((k) => ["ay", "part", "completed"].includes(k)) && Number.isInteger(v.ay) && v.ay >= from && v.ay <= to && typeof v.completed === "boolean" && (v.part === void 0 || Number.isInteger(v.part) && v.part >= 0 && v.part < 1e3);
  }

  // src/study-workflow.mjs
  var $ = (id) => document.getElementById(id);
  var t = (key) => window.tr(key);
  var mode = "range";
  var pendingResume = null;
  var lastProgress = null;
  var attempt = null;
  var draftCombine = false;
  var modeKeys = { range: "mode_range", verse: "mode_verse", cumulative: "mode_cumulative" };
  function modeControl(id, onChange) {
    const select = document.createElement("select");
    select.id = id;
    for (const value of Object.keys(modeKeys)) {
      const option = document.createElement("option");
      option.value = value;
      option.dataset.i18n = modeKeys[value];
      select.append(option);
    }
    select.setAttribute("aria-label", t("study_options"));
    select.addEventListener("change", () => onChange(select.value));
    return select;
  }
  function field(key, control) {
    const label = document.createElement("label");
    label.className = "studyField";
    const text = document.createElement("span");
    text.dataset.i18n = key;
    label.append(text, control);
    return label;
  }
  var details = document.createElement("details");
  details.className = "workflowSettings";
  var summary = document.createElement("summary");
  summary.dataset.i18n = "study_options";
  details.append(summary);
  var grid = document.createElement("div");
  grid.className = "workflowGrid";
  details.append(grid);
  var choice = modeControl("studyMode", (value) => {
    mode = value;
    repeat.checked = true;
    syncModes();
  });
  var choiceField = field("study_method", choice);
  choiceField.classList.add("workflowMethod");
  var methodHelp = document.createElement("small");
  methodHelp.className = "repeatHelp";
  choiceField.append(methodHelp);
  var reciter = document.createElement("select");
  reciter.id = "studyReciter";
  for (const r of RECITERS) {
    const o = document.createElement("option");
    o.value = r.id;
    o.textContent = r.n;
    reciter.append(o);
  }
  grid.append(field("rec_title", reciter));
  var fields = { rangeRep: ["repeat_range_count", 0, 99, 1], combineRep: ["repeat_combine_count", 0, 99, 1], rep: ["repeat_ayah_count", 1, 99, 1], speed: ["s_speed", 0.5, 2, 0.05], wait: ["workflow_wait", 0, 60, 1] };
  for (const [key, [label, min, max, step]] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.id = "studySetting_" + key;
    input.type = "number";
    input.min = min;
    input.max = max;
    input.step = step;
    input.inputMode = "decimal";
    const wrapper = field(label, input);
    const helpKey = { rep: "repeat_ayah_help", combineRep: "repeat_combine_help", rangeRep: "repeat_range_help" }[key];
    if (helpKey) {
      const help = document.createElement("small");
      help.className = "repeatHelp";
      help.id = input.id + "Help";
      help.dataset.i18n = helpKey;
      input.setAttribute("aria-describedby", help.id);
      wrapper.append(help);
    }
    grid.append(wrapper);
    if (["rep", "combineRep", "rangeRep"].includes(key)) input.addEventListener("input", () => {
      repeat.checked = true;
    });
  }
  var repeat = document.createElement("input");
  repeat.type = "checkbox";
  repeat.id = "studyRepeatEnabled";
  grid.append(field("pb_repeat", repeat));
  $("studyOpen").before(choiceField, details);
  var gearMode = modeControl("practiceMode", (value) => {
    mode = value;
    SET.cumu = value === "cumulative";
    saveSet();
    syncModes();
    if (typeof queuePracticeModeChange === "function") queuePracticeModeChange(value);
  });
  var gearField = field("study_method", gearMode);
  gearField.classList.add("workflowMode");
  $("rangeStart").before(gearField);
  var status = document.createElement("p");
  status.id = "practiceProgress";
  status.className = "workflowProgress";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.hidden = true;
  $("studyBanner").append(status);
  var readerStatus = document.createElement("p");
  readerStatus.id = "readerPracticeProgress";
  readerStatus.className = "workflowProgress";
  readerStatus.setAttribute("role", "status");
  readerStatus.setAttribute("aria-live", "polite");
  readerStatus.hidden = true;
  $("studyBanner").after(readerStatus);
  function current() {
    return { reciter: SET.reciter, speed: SET.speed, rep: Math.min(99, Math.max(1, Math.round(SET.rep))), combineRep: SET.combineRep ?? SET.rep, rangeRep: SET.rangeRep ?? SET.rep, repOn: !!SET.repOn, wait: Math.min(60, Math.max(0, SET.wait)), mode, splitCombine: !!SET.cumu };
  }
  function fill(v) {
    draftCombine = v.splitCombine;
    choice.value = v.mode;
    reciter.value = String(v.reciter);
    for (const key of Object.keys(fields)) $("studySetting_" + key).value = v[key] ?? v.rep;
    repeat.checked = v.repOn;
  }
  function read() {
    const v = { ...current(), splitCombine: draftCombine, reciter: Number(reciter.value), mode: choice.value, repOn: repeat.checked };
    for (const key of Object.keys(fields)) v[key] = Number($("studySetting_" + key).value);
    return validStudySettings(v) && RECITERS.some((r) => r.id === v.reciter) ? v : null;
  }
  function syncModes() {
    choice.value = mode;
    gearMode.value = mode;
    syncCumu();
    syncRep();
    render();
  }
  function render() {
    methodHelp.textContent = t("mode_" + mode + "_help");
    choice.setAttribute("aria-label", t("study_method"));
    gearField.hidden = typeof gearCtx !== "undefined" && gearCtx !== "ayah";
    gearMode.setAttribute("aria-label", t("study_method"));
    if (!lastProgress) {
      status.hidden = true;
      readerStatus.hidden = true;
      return;
    }
    const p = lastProgress;
    if (p.sid !== curS) {
      status.hidden = true;
      readerStatus.hidden = true;
      return;
    }
    const partLabel = Number.isInteger(p.combinedFrom) ? Array.from({ length: p.part - p.combinedFrom + 1 }, (_, i) => p.combinedFrom + i + 1).join("+") : p.part + 1;
    const location = (SURAHS[p.sid - 1]?.tr || "") + " \xB7 " + (p.part !== void 0 ? t("study_split_part") + " " + partLabel : p.from + "\u2013" + p.to);
    const cycleLabel = p.cycles > 1 ? t("practice_cycle").replace("{current}", p.cycle).replace("{total}", p.cycles) + " \xB7 " : "";
    const text = location + " \xB7 " + (p.completed ? t("practice_completed") : cycleLabel + t(modeKeys[p.mode] || "mode_range") + " \xB7 " + t("practice_progress").replace("{current}", p.current).replace("{total}", p.total));
    status.textContent = text;
    readerStatus.textContent = text;
    status.hidden = !studyRange || studyRange.sid !== curS;
    readerStatus.hidden = !status.hidden;
  }
  window.elifaPracticeMode = () => mode;
  window.elifaSetPracticeMode = (value) => {
    if (modeKeys[value]) {
      mode = value;
      syncModes();
    }
  };
  window.elifaStudySettings = {
    valid: validStudySettings,
    validProgress: validStudyProgress,
    capture: () => $("studySetup").classList.contains("on") ? read() : current(),
    onSetup(fromReader) {
      if (!fromReader) {
        mode = "range";
        pendingResume = null;
      }
      fill(current());
      syncModes();
    },
    load(item, { resume = false } = {}) {
      const v = validStudySettings(item.settings) ? item.settings : { ...current(), mode: "range", splitCombine: false };
      mode = v.mode;
      fill(v);
      syncModes();
      pendingResume = resume && validStudyProgress(item.progress, item.from, item.to) && !item.progress.completed ? { ...item.progress, sid: item.sid } : null;
    },
    beforeOpen() {
      const v = read();
      if (!v) {
        toast(t("study_invalid"));
        return false;
      }
      mode = v.mode;
      lastProgress = null;
      render();
      Object.assign(SET, { reciter: v.reciter, speed: v.speed, rep: v.rep, combineRep: v.combineRep, rangeRep: v.rangeRep, repOn: v.repOn, wait: v.wait, cumu: v.splitCombine });
      saveSet();
      syncRep();
      syncRep2();
      syncCumu();
      syncSpeedBtn();
      return pendingResume || {};
    },
    afterOpen() {
      if (pendingResume?.sid === curS && pendingResume.part !== void 0) window.elifaResumeStudySplit?.(pendingResume.ay, pendingResume.part);
      pendingResume = null;
    },
    resume: () => pendingResume
  };
  window.elifaActivityBusy = () => !!(playing || $("reader")?.classList.contains("on") || $("split")?.classList.contains("on") || $("studySetup")?.classList.contains("on") || document.getElementById("duaDetBack")?.classList.contains("show"));
  window.elifaPlaybackEvent = (event) => {
    const st = plan[pi] || plan.at(-1);
    const split = window.elifaStudySplitSelection?.();
    if (event === "start") {
      attempt = { mode: split ? "split" : mode === "cumulative" ? "hifz" : mode, started: Date.now() };
      lastProgress = null;
      window.elifaLog?.("playback_start", { mode: attempt.mode });
    }
    if (event === "progress" && st) {
      const part = st.studyPart ?? st.part;
      const ay = split?.ay || (mode === "range" ? studyRange?.from || rangeSelectionDraft?.from || curAy : st.ayEnd || curAy);
      lastProgress = { sid: curS, from: studyRange?.from || rangeSelectionDraft?.from || ay, to: studyRange?.to || rangeSelectionDraft?.to || ay, mode: part !== void 0 ? SET.cumu ? "cumulative" : "verse" : mode, part, combinedFrom: st.combinedFrom, current: pr + 1, total: stepReps(st), cycle: typeof planCycle === "number" ? planCycle + 1 : 1, cycles: typeof planCycleReps === "function" ? planCycleReps() : 1, completed: false };
      if (studyRange) window.elifaStudySessions?.rememberProgress({ ay, ...Number.isInteger(part) ? { part } : {}, completed: false });
      render();
    }
    if (event === "complete" || event === "stop") {
      if (attempt) window.elifaLog?.(event === "complete" ? "playback_complete" : "playback_stopped", { mode: attempt.mode });
      attempt = null;
      if (event === "complete" && lastProgress) {
        lastProgress.completed = true;
        if (studyRange) window.elifaStudySessions?.rememberProgress({ ay: studyRange.from, completed: true });
        render();
      }
    }
  };
  window.elifaAudioFailure = (code) => {
    try {
      window.elifaLog?.("playback_error", { mode: attempt?.mode || "range", error_code: code });
    } catch (e) {
    }
  };
  var report = $("setReportIssue");
  var dialog = document.createElement("dialog");
  dialog.className = "workflowDialog";
  var title = document.createElement("h3");
  title.id = "issueReportTitle";
  title.dataset.i18n = "report_issue";
  dialog.setAttribute("aria-labelledby", title.id);
  var explanation = document.createElement("p");
  explanation.dataset.i18n = "report_details";
  var reason = document.createElement("select");
  reason.setAttribute("aria-label", t("report_issue"));
  for (const key of ["report_tail", "report_cut", "report_repeat", "report_other"]) {
    const option = document.createElement("option");
    option.value = key;
    option.dataset.i18n = key;
    reason.append(option);
  }
  var preview = document.createElement("pre");
  var send = document.createElement("a");
  send.dataset.i18n = "report_send";
  send.className = "workflowSend";
  var close = document.createElement("button");
  close.type = "button";
  close.dataset.i18n = "close";
  close.onclick = () => dialog.close();
  dialog.append(title, explanation, reason, preview, send, close);
  document.body.append(dialog);
  function diagnostic() {
    const split = window.elifaStudySplitSelection?.();
    return { version: $("appVer").textContent, reciter: SET.reciter, surah: curS, ayah: split?.ay || curAy, part: split ? split.selectedIndex + 1 : null, mode: split ? SET.cumu ? "cumulative_parts" : "parts" : mode, speed: SET.speed, repeatEnabled: !!SET.repOn, verseRepeats: SET.rep, combineRepeats: SET.combineRep ?? SET.rep, rangeRounds: SET.rangeRep ?? SET.rep, online: navigator.onLine };
  }
  var context = null;
  function reportText() {
    const text = t(reason.value) + "\n\n" + JSON.stringify(context, null, 2);
    preview.textContent = text;
    send.href = "mailto:info@elifaplatform.com?subject=" + encodeURIComponent("Elifa Mushaf \xB7 " + t("report_issue")) + "&body=" + encodeURIComponent(text);
  }
  report.onclick = () => {
    context = diagnostic();
    reportText();
    dialog.showModal();
    window.elifaLog?.("audio_feedback_open");
  };
  reason.onchange = reportText;
  function refreshLanguage() {
    window.elifaApplyI18n?.();
    syncRep();
    syncRep2();
    render();
    renderContinue();
    renderHomeHeroLine();
    $("q").dispatchEvent(new Event("input"));
    for (const [id, key] of Object.entries({ langBtnH: "language", guideBtnH: "guide", themeBtnH: "theme" })) $(id)?.setAttribute("aria-label", t(key));
    for (const [id, key] of Object.entries({ repInp: "repeat_ayah_count", combineRepInp: "repeat_combine_count", rangeRepInp: "repeat_range_count" })) $(id)?.setAttribute("aria-label", t(key));
    choice.setAttribute("aria-label", t("study_method"));
    reason.setAttribute("aria-label", t("report_issue"));
  }
  window.addEventListener("elifa:language-changed", refreshLanguage);
  new MutationObserver(() => {
    gearField.hidden = gearCtx !== "ayah";
    gearMode.value = mode;
  }).observe($("gearSheet"), { attributes: true, attributeFilter: ["class"] });
  fill(current());
  refreshLanguage();
})();
