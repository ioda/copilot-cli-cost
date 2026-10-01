import { evaluateModels, evaluationCategories, evaluationEfforts, sampleWorkload } from "./model-evaluation.js";

const elements = {
  benchmarkNote: document.getElementById("benchmark-note"),
  breakdown: document.getElementById("breakdown"),
  categoryContent: document.getElementById("category-content"),
  categoryTabs: document.getElementById("category-tabs"),
  currency: document.getElementById("currency"),
  currencyNote: document.getElementById("currency-note"),
  currentPlan: document.getElementById("current-plan"),
  extensionVersion: document.getElementById("extension-version"),
  effortScores: document.getElementById("effort-scores"),
  evaluationEffort: document.getElementById("evaluation-effort"),
  evaluationError: document.getElementById("evaluation-error"),
  evaluationFloor: document.getElementById("evaluation-floor"),
  evaluationResults: document.getElementById("evaluation-results"),
  evaluationSummary: document.getElementById("evaluation-summary"),
  plan: document.getElementById("plan"),
  pricing: document.getElementById("pricing"),
  pricingNote: document.getElementById("pricing-note"),
  pricingTab: document.getElementById("pricing-tab"),
  raw: document.getElementById("raw"),
  refresh: document.getElementById("refresh"),
  sessionCurrent: document.getElementById("session-current"),
  sessionId: document.getElementById("session-id"),
  sessionList: document.getElementById("session-list"),
  sessionPickerNote: document.getElementById("session-picker-note"),
  sessionQuery: document.getElementById("session-query"),
  sessionToggle: document.getElementById("session-toggle"),
  tabBreakdown: document.getElementById("tab-breakdown"),
  tabPricing: document.getElementById("tab-pricing"),
  source: document.getElementById("source"),
  status: document.getElementById("status"),
  updatedAt: document.getElementById("updated-at"),
  usageAllowance: document.getElementById("usage-allowance"),
  usageSubtitle: document.getElementById("usage-subtitle"),
  usageTotal: document.getElementById("usage-total"),
  whatIfNote: document.getElementById("what-if-note"),
  workloadInput: document.getElementById("workload-input"),
  workloadCached: document.getElementById("workload-cached"),
  workloadWrite: document.getElementById("workload-write"),
  workloadOutput: document.getElementById("workload-output"),
  workloadReset: document.getElementById("workload-reset")
};
let selectedCurrency;
let selectedPlan;
let selectedSession = { source: "live" };
let sessionListOpen = false;
let sessionItems = [];
let selectedCategory = "Powerful";
let latestData;
const planAllowances = {
  free: { baseAiCredits: 0, flexAiCredits: 0, totalAiCredits: 0 },
  pro: { baseAiCredits: 1000, flexAiCredits: 500, totalAiCredits: 1500 },
  "pro-plus": { baseAiCredits: 3900, flexAiCredits: 3100, totalAiCredits: 7000 },
  max: { baseAiCredits: 10000, flexAiCredits: 10000, totalAiCredits: 20000 },
  business: { baseAiCredits: 1900, flexAiCredits: 0, promotionalAiCredits: 1100, totalAiCredits: 3000 },
  enterprise: { baseAiCredits: 3900, flexAiCredits: 0, promotionalAiCredits: 3100, totalAiCredits: 7000 },
  student: { baseAiCredits: 0, flexAiCredits: 0, totalAiCredits: 0 }
};
const planLabels = {
  free: "Copilot Free",
  pro: "Copilot Pro",
  "pro-plus": "Copilot Pro+",
  max: "Copilot Max",
  business: "Copilot Business",
  enterprise: "Copilot Enterprise",
  student: "Copilot Student"
};

elements.refresh.addEventListener("click", () => refresh({ reloadSessions: true }));
elements.sessionCurrent.addEventListener("click", () => {
  selectedSession = { source: "live" };
  renderSessionPicker();
  closeSessionList();
  refresh();
});
elements.sessionToggle.addEventListener("click", () => {
  if (sessionListOpen) {
    closeSessionList();
  } else {
    openSessionList();
  }
});
elements.sessionList.addEventListener("click", (event) => {
  const option = event.target.closest(".session-option");
  if (!option) {
    return;
  }
  const item = sessionItems.find((candidate) => candidate.key === option.dataset.sessionKey);
  if (item) {
    selectSession(item);
  }
});
elements.sessionQuery.addEventListener("focus", openSessionList);
elements.sessionQuery.addEventListener("input", () => {
  openSessionList();
  renderSessionPicker();
});
elements.sessionQuery.addEventListener("change", () => {
  if (selectSessionFromQuery({ allowPartial: true })) {
    refresh();
  }
});
elements.sessionQuery.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeSessionList();
    return;
  }
  if (event.key === "ArrowDown") {
    openSessionList();
    elements.sessionList.querySelector(".session-option")?.focus();
    event.preventDefault();
    return;
  }
  if (event.key === "Enter" && selectSessionFromQuery({ allowPartial: true })) {
    closeSessionList();
    refresh();
  }
});
elements.plan.addEventListener("change", () => {
  selectedPlan = elements.plan.value;
  refresh();
});
elements.currency.addEventListener("change", () => {
  selectedCurrency = elements.currency.value;
  refresh();
});
elements.tabBreakdown.addEventListener("click", () => selectTab("breakdown"));
elements.tabPricing.addEventListener("click", () => selectTab("pricing"));
elements.categoryTabs.addEventListener("click", (event) => {
  const tab = event.target.closest("[data-category]");
  if (tab) {
    selectPricingCategory(tab.dataset.category);
  }
});
elements.categoryTabs.addEventListener("keydown", (event) => {
  const tab = event.target.closest("[data-category]");
  if (!tab || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
    return;
  }
  event.preventDefault();
  const current = evaluationCategories.indexOf(tab.dataset.category);
  const next = event.key === "Home" ? 0 : event.key === "End" ? evaluationCategories.length - 1
    : (current + (event.key === "ArrowRight" ? 1 : -1) + evaluationCategories.length) % evaluationCategories.length;
  selectPricingCategory(evaluationCategories[next]);
  elements.categoryTabs.querySelector(`[data-category="${evaluationCategories[next]}"]`).focus();
});
for (const control of [
  elements.evaluationEffort, elements.evaluationFloor, elements.workloadInput,
  elements.workloadCached, elements.workloadWrite, elements.workloadOutput
]) {
  control.addEventListener("input", renderModelEvaluation);
}
elements.workloadReset.addEventListener("click", () => {
  elements.workloadInput.value = sampleWorkload.uncachedInputTokens;
  elements.workloadCached.value = sampleWorkload.cachedInputTokens;
  elements.workloadWrite.value = sampleWorkload.cacheWriteTokens;
  elements.workloadOutput.value = sampleWorkload.outputTokens;
  renderModelEvaluation();
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".session-picker")) {
    closeSessionList();
  }
  openExternalLink(event);
});
setInterval(() => {
  if (!isSessionPickerActive() && (selectedSession.source === "live" || selectedSession.source === "live-session")) {
    refresh();
  }
}, 2000);
setInterval(() => {
  loadSessions().catch((error) => showStatusError(`Unable to refresh session list: ${error.message}`));
}, 10000);
initialize();

async function initialize() {
  try {
    await loadSessions();
    await refresh();
  } catch (error) {
    showStatusError(`Unable to initialize cost panel: ${error.message}`);
  }
}

async function loadSessions() {
  const data = await copilot.listSessions();
  renderExtensionVersion(data.extensionVersion);
  sessionItems = data.sessions.map((item) => ({
    ...item,
    key: sessionKey(item),
    optionValue: formatSessionOption(item),
    searchText: formatSessionSearchText(item)
  }));
  renderSessionPicker();
  return data;
}

async function refresh({ reloadSessions = false } = {}) {
  try {
    if (reloadSessions) {
      await loadSessions();
    }
    selectSessionFromQuery();
    const data = await copilot.getCostData({
      ...(selectedPlan ? { plan: selectedPlan } : {}),
      ...(selectedCurrency ? { currency: selectedCurrency } : {}),
      ...selectedSessionRequest()
    });
    render(data);
  } catch (error) {
    showStatusError(`Unable to read session cost data: ${error.message}`);
  }
}

function render(data) {
  latestData = data;
  const usageBased = data.usageBased;
  const aggregateUsageBased = data.aggregateUsageBased;
  const sessionUsage = data.sessionUsage ?? {};
  const isResumed = sessionUsage.logicalSession?.isResumed === true;
  const currentSubscription = data.currentSubscription ?? inferCurrentSubscription(data);
  const currentPlan = currentSubscription?.plan;
  const activePlan = selectedPlan ?? usageBased?.plan ?? currentPlan;
  renderExtensionVersion(data.extensionVersion);
  renderCurrentPlan(currentSubscription, activePlan);
  renderCurrency(data);
  if (!selectedPlan && activePlan && elements.plan.value !== activePlan) {
    elements.plan.value = activePlan;
  }

  elements.updatedAt.textContent = `Last updated ${new Date(data.generatedAt).toLocaleTimeString()}`;
  elements.status.hidden = true;
  elements.sessionId.textContent = sessionUsage.sessionId ?? "(unknown)";
  elements.source.textContent = isResumed
    ? `resumed logical session · ${sessionUsage.logicalSession.instanceCount} instances`
    : sessionUsage.source ?? data.source ?? "-";
  syncSelectedSessionFromData(data);
  renderSessionPicker();

  if (usageBased?.error) {
    elements.usageTotal.textContent = "Unavailable";
    elements.usageSubtitle.textContent = usageBased.error;
    hideAllowanceMeter(elements.usageAllowance);
  } else {
    const usagePlan = selectedPlan ?? usageBased.plan;
    const displayedUsage = isResumed && aggregateUsageBased && !aggregateUsageBased.error
      ? aggregateUsageBased
      : usageBased;
    const includedAiCreditAllotment = readAiCreditAllotment(displayedUsage, usagePlan);
    const allowanceUsage = formatAiCreditAllowanceUsage(displayedUsage.allowanceUsagePercentage, includedAiCreditAllotment);
    elements.usageTotal.textContent = formatCurrency(displayedUsage.displayTotal, displayedUsage.currency.code);
    const creditSource = formatCreditCalculation(displayedUsage);
    elements.usageSubtitle.textContent = isResumed && displayedUsage === aggregateUsageBased
      ? `logical total · this instance ${formatCurrency(usageBased.displayTotal, usageBased.currency.code)} · ${formatNumber(displayedUsage.aiCredits, 1)} AI credits · ${creditSource} · ${allowanceUsage} · ${usagePlan}`
      : `${formatNumber(usageBased.aiCredits, 1)} AI credits · ${creditSource} · ${allowanceUsage} · ${usagePlan}`;
    updateAllowanceMeter(elements.usageAllowance, displayedUsage.allowanceUsagePercentage, allowanceUsage);
  }

  renderBreakdown(usageBased);
  renderCategoryContent();
  elements.raw.textContent = JSON.stringify(data, null, 2);
}

function selectPricingCategory(category) {
  if (!evaluationCategories.includes(category)) {
    return;
  }
  selectedCategory = category;
  for (const tab of elements.categoryTabs.querySelectorAll("[data-category]")) {
    const selected = tab.dataset.category === category;
    tab.classList.toggle("active", selected);
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    if (selected) {
      elements.categoryContent.setAttribute("aria-labelledby", tab.id);
    }
  }
  renderCategoryContent();
}

function renderCategoryContent() {
  if (!latestData) {
    return;
  }
  renderPricing(
    latestData.modelPricing?.filter((item) => item.category === selectedCategory),
    latestData.usageBased?.currency,
    latestData.pricingSource
  );
  renderModelEvaluation();
}

function renderModelEvaluation() {
  if (!latestData) {
    return;
  }
  const source = latestData.benchmarkSource;
  elements.benchmarkNote.innerHTML = source
    ? `<a href="${escapeHtml(source.url)}" data-external>${escapeHtml(source.name)}</a> · snapshot verified ${escapeHtml(source.verifiedAt)}. ${escapeHtml(source.note)}`
    : "Benchmark snapshot unavailable. No capability-based recommendations can be made.";
  renderEffortScores();
  try {
    const result = evaluateModels(latestData.modelPricing ?? [], latestData.modelBenchmarks, {
      category: selectedCategory,
      effort: elements.evaluationEffort.value,
      qualityFloor: elements.evaluationFloor.valueAsNumber / 100,
      workload: {
        uncachedInputTokens: elements.workloadInput.valueAsNumber,
        cachedInputTokens: elements.workloadCached.valueAsNumber,
        cacheWriteTokens: elements.workloadWrite.valueAsNumber,
        outputTokens: elements.workloadOutput.valueAsNumber
      }
    });
    elements.evaluationError.hidden = true;
    const currency = latestData.usageBased?.currency ?? { code: "USD", exchangeRate: 1 };
    const effortLabel = elements.evaluationEffort.selectedOptions[0].textContent;
    const coverage = `${result.scoredCount}/${result.rows.length} models have unqualified scores for ${effortLabel}; ${result.eligibleCount} pass the ${elements.evaluationFloor.value}% floor.`;
    elements.evaluationSummary.textContent = result.recommendations.length
      ? `Best estimated value: ${result.recommendations.join(", ")} (${effortLabel}). ${coverage}${result.scoredCount === 1 ? " Only one scored candidate: this is a baseline, not a competitive comparison." : ""}`
      : `No recommendation. ${coverage}`;
    elements.evaluationResults.innerHTML = `
      <div class="pricing-table-wrap">
        <table>
          <thead><tr>
            <th>Model</th><th>Score</th><th>Capability / best</th>
            <th>Workload cost (${escapeHtml(currency.code)})</th><th>Price tier</th><th>Value</th><th>Decision</th>
          </tr></thead>
          <tbody>${result.rows.map((row) => `
            <tr class="${row.recommended ? "recommended-row" : ""}">
              <td title="${escapeHtml(row.configuration ?? "No verified benchmark configuration")}">${escapeHtml(row.model)}</td>
              <td>${row.score === undefined ? "Not verified" : `${formatNumber(row.score, 1)}${row.status === "qualified-benchmark" ? "*" : ""}`}</td>
              <td>${row.relativeCapability === undefined ? "-" : `${formatNumber(row.relativeCapability * 100, 1)}%`}</td>
              <td>${formatWorkloadCost(row.workloadCostUsd, currency)}</td>
              <td>${escapeHtml(row.rateTier)}</td>
              <td>${row.value === undefined ? "-" : formatNumber(row.value, 3)}</td>
              <td>${row.recommended ? "Best estimated value" : evaluationStatus(row.status)}</td>
            </tr>
          `).join("")}</tbody>
        </table>
      </div>`;
  } catch (error) {
    elements.evaluationError.textContent = `Unable to evaluate models: ${error.message}`;
    elements.evaluationError.hidden = false;
    elements.evaluationSummary.textContent = "No recommendation until the evaluation error is resolved.";
    elements.evaluationResults.innerHTML = "";
  }
}

function evaluationStatus(status) {
  return {
    "missing-benchmark": "No comparable score",
    "qualified-benchmark": "Qualified score; not ranked",
    "below-floor": "Below capability floor",
    eligible: "Eligible"
  }[status] ?? status;
}

function renderEffortScores() {
  const models = latestData.modelPricing?.filter((item) => item.category === selectedCategory) ?? [];
  elements.effortScores.innerHTML = `
    <div class="pricing-table-wrap"><table>
      <thead><tr><th>Model</th>${evaluationEfforts.map((effort) =>
        `<th>${effort === "none" ? "Non-reasoning" : escapeHtml(capitalize(effort))}</th>`
      ).join("")}<th>Benchmark configuration</th></tr></thead>
      <tbody>${models.map((item) => {
        const benchmark = latestData.modelBenchmarks?.[item.model];
        return `<tr><td>${escapeHtml(item.model)}</td>${evaluationEfforts.map((effort) => {
          const score = benchmark?.scores?.[effort];
          return `<td>${score === undefined ? "-" : `${formatNumber(score, 1)}${benchmark.qualifiedEfforts?.includes(effort) ? "*" : ""}`}</td>`;
        }).join("")}<td class="benchmark-configuration">${escapeHtml(benchmark?.configuration ?? "No verified effort-specific benchmark in this snapshot.")}${benchmark?.unspecifiedEffortScore !== undefined ? ` Score ${formatNumber(benchmark.unspecifiedEffortScore, 1)} (effort unspecified).` : ""}</td></tr>`;
      }).join("")}</tbody>
    </table></div>`;
}

function formatWorkloadCost(usd, currency) {
  return `~${new Intl.NumberFormat(undefined, {
    currency: currency.code,
    maximumFractionDigits: 6,
    minimumFractionDigits: 4,
    style: "currency"
  }).format(usd * Number(currency.exchangeRate ?? 1))}`;
}

function selectTab(tab) {
  const pricingSelected = tab === "pricing";
  elements.breakdown.parentElement.hidden = pricingSelected;
  elements.pricingTab.hidden = !pricingSelected;
  elements.tabBreakdown.classList.toggle("active", !pricingSelected);
  elements.tabPricing.classList.toggle("active", pricingSelected);
  elements.tabBreakdown.setAttribute("aria-selected", String(!pricingSelected));
  elements.tabPricing.setAttribute("aria-selected", String(pricingSelected));
}

function renderSessionPicker() {
  const selectedItem = sessionItems.find((item) => item.key === sessionKey(selectedSession));
  if (selectedItem && document.activeElement !== elements.sessionQuery) {
    elements.sessionQuery.value = selectedItem.optionValue;
  } else if (selectedSession.source === "live" && document.activeElement !== elements.sessionQuery) {
    elements.sessionQuery.value = "Current session";
  }

  const count = sessionItems.length;
  elements.sessionPickerNote.textContent = count > 0
    ? `Showing ${formatInteger(count)} sessions. Search by name, ID, workspace, or source.`
    : "No cached or completed sessions found yet.";

  renderSessionList();
}

function showStatusError(message) {
  elements.status.textContent = message;
  elements.status.className = "status error";
  elements.status.hidden = false;
}

function renderSessionList() {
  const query = getSessionSearchQuery();
  const groups = getSessionGroups(query);
  const html = [];
  for (const group of groups) {
    if (group.items.length === 0) {
      continue;
    }
    if (group.title) {
      html.push(`<div class="session-list-heading">${escapeHtml(group.title)}</div>`);
    }
    html.push(...group.items.map(renderSessionOption));
  }

  elements.sessionList.innerHTML = html.length > 0
    ? html.join("")
    : "<p class=\"empty\">No sessions found.</p>";
}

function renderSessionOption(item) {
  const selected = item.key === sessionKey(selectedSession);
  const name = item.sessionName || (item.isCurrent ? "Current session" : "(unnamed session)");
  const meta = [
    item.sessionId,
    formatSessionSource(item.source),
    item.repository,
    item.branch,
    item.workspaceDirectory
  ].filter(Boolean).join(" - ");
  return `
    <button type="button" class="session-option${selected ? " selected" : ""}" data-session-key="${escapeHtml(item.key)}" role="option" aria-selected="${selected}">
      <span class="session-option-title">${escapeHtml(name)}</span>
      <span class="session-option-meta">${escapeHtml(meta)}</span>
    </button>
  `;
}

function getSessionGroups(query) {
  if (!query) {
    return [{ title: undefined, items: sessionItems }];
  }

  const matching = [];
  const other = [];
  for (const item of sessionItems) {
    if (item.searchText.includes(query)) {
      matching.push(item);
    } else {
      other.push(item);
    }
  }

  return [
    { title: "Matching sessions", items: matching },
    { title: "Other sessions", items: other }
  ];
}

function getSessionSearchQuery() {
  const query = elements.sessionQuery.value.trim();
  const selectedItem = sessionItems.find((item) => item.key === sessionKey(selectedSession));
  if (!query || query === selectedItem?.optionValue) {
    return "";
  }
  return query.toLowerCase();
}

function openSessionList() {
  sessionListOpen = true;
  elements.sessionList.hidden = false;
  elements.sessionToggle.setAttribute("aria-expanded", "true");
  renderSessionList();
}

function closeSessionList() {
  sessionListOpen = false;
  elements.sessionList.hidden = true;
  elements.sessionToggle.setAttribute("aria-expanded", "false");
}

function isSessionPickerActive() {
  return sessionListOpen || document.activeElement === elements.sessionQuery || elements.sessionList.contains(document.activeElement);
}

function selectSession(item) {
  selectedSession = {
    source: item.source,
    sessionId: item.source === "live" ? undefined : item.sessionId
  };
  elements.sessionQuery.value = item.optionValue;
  closeSessionList();
  renderSessionPicker();
  refresh();
}

function selectSessionFromQuery({ allowPartial = false } = {}) {
  const query = elements.sessionQuery.value.trim();
  if (!query) {
    selectedSession = { source: "live" };
    return true;
  }

  let match = sessionItems.find((item) => item.optionValue === query);
  if (!match && allowPartial) {
    const normalizedQuery = query.toLowerCase();
    match = sessionItems.find((item) => item.searchText.includes(normalizedQuery));
  }

  if (!match) {
    return false;
  }

  const nextSelection = {
    source: match.source,
    sessionId: match.source === "live" ? undefined : match.sessionId
  };
  const changed = sessionKey(nextSelection) !== sessionKey(selectedSession);
  selectedSession = nextSelection;
  if (changed) {
    renderSessionPicker();
  }
  return changed;
}

function selectedSessionRequest() {
  if (selectedSession.source === "live") {
    return { source: "live" };
  }
  return {
    source: selectedSession.source,
    sessionId: selectedSession.sessionId
  };
}

function syncSelectedSessionFromData(data) {
  if (selectedSession.source !== "live") {
    return;
  }

  const sessionId = data.sessionUsage?.sessionId;
  if (!sessionId) {
    return;
  }

  const currentItem = sessionItems.find((item) => item.source === "live");
  if (currentItem) {
    currentItem.sessionId = sessionId;
    currentItem.searchText = formatSessionSearchText(currentItem);
    currentItem.optionValue = formatSessionOption(currentItem);
  }
}

function renderCurrency(data) {
  const currency = data.usageBased?.currency;
  const currencyCode = currency?.code ?? data.exchangeRate?.quote ?? "USD";
  if (!selectedCurrency && elements.currency.value !== currencyCode) {
    elements.currency.value = currencyCode;
  }

  const rateInfo = data.exchangeRate ?? currency;
  if (currencyCode === "USD") {
    elements.currencyNote.textContent = "Currency: USD (canonical)";
    return;
  }

  const rate = Number(rateInfo?.rate ?? currency?.exchangeRate);
  const source = rateInfo?.source ?? currency?.source ?? "exchange rate";
  const date = rateInfo?.date ? ` · ${rateInfo.date}` : "";
  elements.currencyNote.textContent = `Currency: 1 USD = ${formatNumber(rate, 6)} ${currencyCode} · ${source}${date}`;
}

function renderExtensionVersion(version) {
  elements.extensionVersion.textContent = version ? `Extension version ${version}` : "Extension version unavailable";
}

function sessionKey(item) {
  return `${item.source}:${item.source === "live" ? "current" : item.sessionId ?? ""}`;
}

function formatSessionOption(item) {
  const source = formatSessionSource(item.source);
  const name = item.sessionName || (item.isCurrent ? "Current session" : "(unnamed session)");
  return item.sessionId ? `${name} - ${item.sessionId} (${source})` : `${name} (${source})`;
}

function formatSessionSearchText(item) {
  return [
    item.sessionName,
    item.sessionId,
    item.workspaceDirectory,
    item.repository,
    item.branch,
    item.source,
    formatSessionSource(item.source)
  ].filter(Boolean).join(" ").toLowerCase();
}

function formatSessionSource(source) {
  if (source === "live") {
    return "current";
  }
  if (source === "live-session") {
    return "live snapshot";
  }
  if (source === "completed") {
    return "completed";
  }
  return source ?? "unknown";
}

async function openExternalLink(event) {
  const link = event.target.closest("a[data-external]");
  if (!link) {
    return;
  }

  event.preventDefault();
  try {
    await copilot.openExternal(link.href);
  } catch (error) {
    elements.status.textContent = `Unable to open link: ${error.message}`;
    elements.status.className = "status error";
  }
}

function inferCurrentSubscription(data) {
  const inferredPlan = data.usageBased?.plan;
  return inferredPlan
    ? {
        inferred: true,
        plan: inferredPlan,
        source: "calculated default plan"
      }
    : undefined;
}

function renderCurrentPlan(currentSubscription, activePlan) {
  const currentPlan = currentSubscription?.plan;
  updatePlanOptionLabels(currentPlan);

  if (currentPlan) {
    const currentLabel = planLabels[currentPlan] ?? currentPlan;
    const qualifier = currentSubscription.inferred ? "assumed" : "current";
    const envOverride = currentSubscription.source === "COPILOT_COST_PLAN";
    const detectedPlan = currentSubscription.detectedPlan;
    const overrideSuffix = envOverride
      ? ` (via COPILOT_COST_PLAN${detectedPlan ? `, detected: ${planLabels[detectedPlan] ?? detectedPlan}` : ""})`
      : "";
    elements.currentPlan.textContent = `${capitalize(qualifier)} subscription: ${currentLabel}${currentSubscription.login ? ` (${currentSubscription.login})` : ""}${overrideSuffix}`;
  } else {
    const rawPlan = currentSubscription?.rawPlan ? ` (${currentSubscription.rawPlan})` : "";
    elements.currentPlan.textContent = `Current subscription: unavailable${rawPlan}`;
  }

  if (currentPlan && activePlan && activePlan !== currentPlan) {
    elements.whatIfNote.textContent = `Showing what-if costs for ${planLabels[activePlan] ?? activePlan}. Select ${planLabels[currentPlan] ?? currentPlan} (current) to switch back.`;
  } else if (currentPlan) {
    elements.whatIfNote.textContent = "Showing your current subscription. Select another plan to compare allowances.";
  } else {
    elements.whatIfNote.textContent = "Recalculates allowances for the selected plan. Token usage and model are kept as observed.";
  }
}

function readAiCreditAllotment(usageBased, usagePlan) {
  const planAllotment = planAllowances[usagePlan];
  const resultAllotment = usageBased.includedAiCreditAllotment;
  return resultAllotment ?? (planAllotment
    ? {
        baseAiCredits: planAllotment.baseAiCredits,
        flexAiCredits: planAllotment.flexAiCredits,
        promotionalAiCredits: planAllotment.promotionalAiCredits ?? 0,
        totalAiCredits: planAllotment.totalAiCredits
      }
    : {
        baseAiCredits: 0,
        flexAiCredits: 0,
        promotionalAiCredits: 0,
        totalAiCredits: usageBased.includedAiCredits ?? 0
      });
}

function formatAiCreditAllotment(allotment) {
  const total = formatNumber(allotment.totalAiCredits, 1);
  const components = formatAiCreditAllotmentComponents(allotment);
  if (components.length <= 0) {
    return `${total} included`;
  }
  return `${total} included (${components.join(" + ")})`;
}

function formatAiCreditAllotmentComponents(allotment) {
  const components = [];
  const base = Number(allotment.baseAiCredits ?? 0);
  const flex = Number(allotment.flexAiCredits ?? 0);
  const promotional = Number(allotment.promotionalAiCredits ?? 0);
  if (base > 0 && (flex > 0 || promotional > 0)) {
    components.push(`${formatNumber(base, 1)} base`);
  }
  if (flex > 0) {
    components.push(`${formatNumber(flex, 1)} flex`);
  }
  if (promotional > 0) {
    components.push(`${formatNumber(promotional, 1)} promotional`);
  }
  return components;
}

function formatAiCreditAllowanceUsage(percentage, allotment) {
  const percentageText = formatPercentage(readPercentage(percentage));
  const allotmentText = formatAiCreditAllotment(allotment);
  return percentageText ? `${percentageText} of ${allotmentText}` : allotmentText;
}

function updateAllowanceMeter(element, percentage, label) {
  const percentageValue = readPercentage(percentage);
  if (percentageValue === null) {
    hideAllowanceMeter(element);
    return;
  }

  const clampedPercentage = Math.min(percentageValue, 100);
  element.hidden = false;
  element.innerHTML = `
    <div class="allowance-meter-bar" aria-hidden="true">
      <span style="width: ${clampedPercentage}%"></span>
    </div>
    <p>${escapeHtml(label)}</p>
  `;
}

function hideAllowanceMeter(element) {
  element.hidden = true;
  element.innerHTML = "";
}

function readPercentage(value) {
  const percentage = Number(value);
  return Number.isFinite(percentage) && percentage >= 0 ? percentage : null;
}

function formatPercentage(value) {
  if (value === null) {
    return "";
  }
  if (value > 0 && value < 0.1) {
    return "<0.1%";
  }
  return `${formatNumber(value, value < 10 ? 1 : 0)}%`;
}

function capitalize(value) {
  const text = String(value);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function updatePlanOptionLabels(currentPlan) {
  for (const option of elements.plan.options) {
    const label = planLabels[option.value] ?? option.value;
    option.textContent = option.value === currentPlan ? `${label} (current)` : label;
  }
}

function renderBreakdown(usageBased) {
  if (!usageBased?.modelBreakdown?.length) {
    elements.breakdown.innerHTML = "<p class=\"empty\">No model breakdown available.</p>";
    return;
  }

  const currency = usageBased.currency ?? { code: "USD", exchangeRate: 1 };
  elements.breakdown.innerHTML = usageBased.modelBreakdown.map((item) => {
    const uncachedInputTokens = item.uncachedInputTokens ?? Math.max(Number(item.inputTokens ?? 0) - Number(item.cachedInputTokens ?? 0), 0);
    return `
      <div class="model-card">
        <div class="model-card-header">
          <strong>${escapeHtml(formatModelName(item))}</strong>
          <span>${formatCurrency(item.displayTotal, currency.code)} · ${formatNumber(item.aiCredits, 1)} credits</span>
        </div>
        <p class="model-card-meta">${escapeHtml(formatCreditCalculation(item))}${formatTokenEstimateNote(item, currency)}</p>
        <table>
          <thead>
            <tr>
              <th>Bucket</th>
              <th>Tokens</th>
              <th>Rate / 1M (${escapeHtml(currency.code)})</th>
              <th>Cost (${escapeHtml(currency.code)})</th>
            </tr>
          </thead>
          <tbody>
            ${renderBucket("Uncached input", uncachedInputTokens, item.rates?.inputPerMillionUsd, item.inputUsd, currency)}
            ${renderBucket("Cached input", item.cachedInputTokens, item.rates?.cachedInputPerMillionUsd, item.cachedInputUsd, currency)}
            ${renderBucket("Cache write", item.cacheWriteTokens, item.rates?.cacheWritePerMillionUsd, item.cacheWriteUsd, currency)}
            ${renderBucket("Output", item.outputTokens, item.rates?.outputPerMillionUsd, item.outputUsd, currency)}
            ${renderBucket("Reasoning", item.reasoningTokens, item.rates?.reasoningPerMillionUsd, item.reasoningUsd, currency)}
          </tbody>
        </table>
      </div>
    `;
  }).join("");
}

function renderPricing(modelPricing, currency, source) {
  if (!modelPricing?.length) {
    elements.pricing.innerHTML = "<p class=\"empty\">No model pricing available.</p>";
    return;
  }

  const displayCurrency = currency?.code ?? "USD";
  const exchangeRate = Number(currency?.exchangeRate ?? 1);
  const sourceDate = source?.verifiedAt ? ` · verified ${source.verifiedAt}` : "";
  elements.pricingNote.innerHTML = `Published rate estimates per 1M tokens. Equivalents are approximate price/capability comparisons, not official model substitutions. <a href="${escapeHtml(source?.url ?? "https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing")}" data-external>GitHub pricing source</a>${sourceDate}.`;
  elements.pricing.innerHTML = `
    <div class="pricing-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Model</th>
            <th>Approx. equivalent</th>
            <th>Category</th>
            <th>Tier</th>
            <th>Threshold</th>
            <th>Input / 1M</th>
            <th>Cached / 1M</th>
            <th>Cache write / 1M</th>
            <th>Output / 1M</th>
          </tr>
        </thead>
        <tbody>
          ${modelPricing.map((item) => `
            <tr>
              <td>${escapeHtml(item.model)}</td>
              <td class="equivalent">${escapeHtml(item.equivalentModel ?? "—")}</td>
              <td>${escapeHtml(item.category ?? "—")}</td>
              <td>${escapeHtml(item.tier ?? "Default")}</td>
              <td>${formatContextThreshold(item.longContext?.thresholdInputTokens, false)}</td>
              <td>${formatRate(item.inputPerMillionUsd, exchangeRate, displayCurrency)}</td>
              <td>${formatRate(item.cachedInputPerMillionUsd, exchangeRate, displayCurrency)}</td>
              <td>${formatRate(item.cacheWritePerMillionUsd, exchangeRate, displayCurrency)}</td>
              <td>${formatRate(item.outputPerMillionUsd, exchangeRate, displayCurrency)}</td>
            </tr>
            ${item.longContext ? `
              <tr class="long-context-row">
                <td>${escapeHtml(item.model)} (long context)</td>
                <td class="equivalent">${escapeHtml(item.equivalentModel ?? "—")}</td>
                <td>${escapeHtml(item.category ?? "—")}</td>
                <td>Long context</td>
                <td>${formatContextThreshold(item.longContext.thresholdInputTokens, true)}</td>
                <td>${formatRate(item.longContext.inputPerMillionUsd, exchangeRate, displayCurrency)}</td>
                <td>${formatRate(item.longContext.cachedInputPerMillionUsd, exchangeRate, displayCurrency)}</td>
                <td>${formatRate(item.longContext.cacheWritePerMillionUsd, exchangeRate, displayCurrency)}</td>
                <td>${formatRate(item.longContext.outputPerMillionUsd, exchangeRate, displayCurrency)}</td>
              </tr>
            ` : ""}
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function formatRate(value, exchangeRate, currencyCode) {
  if (value === undefined || value === null) {
    return "—";
  }
  return formatCurrency(Number(value ?? 0) * exchangeRate, currencyCode);
}

function formatContextThreshold(threshold, longContext) {
  if (!Number.isFinite(Number(threshold))) {
    return "—";
  }
  const value = formatInteger(threshold);
  return longContext ? `> ${value}` : `≤ ${value}`;
}

function formatModelName(item) {
  if (item.rateTier === "long-context") {
    return `${item.model} (long context)`;
  }
  return item.model;
}

function formatCreditCalculation(result) {
  switch (result?.creditCalculationSource) {
    case "copilot-cli-session-aiu":
      return "Copilot-reported AI credits";
    case "copilot-cli-model-aiu":
      return "Copilot-reported model AI credits";
    case "mixed-model-aiu-token-estimate":
      return "mixed Copilot/model token estimate";
    case "model-ai-credits":
    case "session-ai-credits":
      return "provided AI credits";
    case "token-rate-estimate":
    default:
      return "token-rate estimate";
  }
}

function formatTokenEstimateNote(result, currency) {
  if (!result || result.creditCalculationSource === "token-rate-estimate") {
    return "";
  }

  const estimated = Number(result.tokenEstimatedDisplayTotal);
  if (!Number.isFinite(estimated)) {
    return "";
  }

  return ` · token estimate ${escapeHtml(formatCurrency(estimated, currency?.code ?? "USD"))}`;
}

function renderBucket(label, tokens, rate, cost, currency) {
  const displayedRate = rate ?? inferRatePerMillion(tokens, cost);
  const exchangeRate = Number(currency?.exchangeRate ?? 1);
  return `
    <tr>
      <td>${escapeHtml(label)}</td>
      <td>${formatInteger(tokens)}</td>
      <td>${formatCurrency(displayedRate * exchangeRate, currency?.code ?? "USD")}</td>
      <td>${formatCurrency(Number(cost ?? 0) * exchangeRate, currency?.code ?? "USD")}</td>
    </tr>
  `;
}

function inferRatePerMillion(tokens, cost) {
  const tokenCount = Number(tokens ?? 0);
  const bucketCost = Number(cost ?? 0);
  if (!Number.isFinite(tokenCount) || tokenCount <= 0 || !Number.isFinite(bucketCost)) {
    return 0;
  }
  return (bucketCost / tokenCount) * 1_000_000;
}

function formatCurrency(value, currencyCode = "USD") {
  return `~${new Intl.NumberFormat(undefined, {
    currency: currencyCode,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency"
  }).format(Number(value ?? 0))}`;
}

function formatInteger(value) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0
  }).format(Number(value ?? 0));
}

function formatNumber(value, maximumFractionDigits = 1) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits
  }).format(Number(value ?? 0));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  })[char]);
}
