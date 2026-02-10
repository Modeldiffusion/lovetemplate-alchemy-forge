/**
 * Loss Mitigation Collections Workflow - Frontend
 * Connects to Spring Boot backend via REST APIs
 */

// ─── Application State ───────────────────────────────────────────────
const appState = {
    currentStep: 0,
    completedSteps: [],
    loanData: null,
    sidebarCollapsed: false,
    stepNotes: {},
    hardshipState: { category: null, hardshipType: null, reason: null, answers: [], isDisaster: false }
};

// Workflow steps loaded from server
let workflowSteps = [];
let stepIdToIndex = {};

// ─── API Helper ──────────────────────────────────────────────────────
function api(path) {
    return fetch(path).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); });
}

// ─── Initialization ──────────────────────────────────────────────────
function initApp() {
    try {
        workflowSteps = JSON.parse(WORKFLOW_STEPS_JSON);
    } catch (e) {
        workflowSteps = [];
    }
    workflowSteps.forEach((s, i) => { stepIdToIndex[s.id] = i; });
    renderSidebar();
    loadStep(0);
}

// ─── Sidebar ─────────────────────────────────────────────────────────
function renderSidebar() {
    const container = document.getElementById('workflowSteps');
    container.innerHTML = workflowSteps.map((step, index) => {
        const isActive = index === appState.currentStep;
        const isCompleted = appState.completedSteps.includes(index);
        return '<div class="step-item' + (isActive ? ' active' : '') + (isCompleted ? ' completed' : '') + '" onclick="loadStep(' + index + ')">'
            + (isCompleted
                ? '<span class="step-icon completed-icon">&#10003;</span>'
                : '<span class="step-icon">' + step.icon + '</span>')
            + '<span class="step-name">' + step.name + '</span>'
            + '<div class="tooltip">' + step.icon + ' ' + step.name + '</div>'
            + '</div>';
    }).join('');
}

function toggleSidebar() {
    appState.sidebarCollapsed = !appState.sidebarCollapsed;
    document.getElementById('sidebar').classList.toggle('collapsed');
    document.getElementById('mainContent').classList.toggle('expanded');
    document.getElementById('loanDetailsHeader').classList.toggle('expanded');
    document.querySelector('.toggle-text').textContent = appState.sidebarCollapsed ? 'Expand Menu' : 'Collapse Menu';
}

// ─── Tab Switching ───────────────────────────────────────────────────
function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    event.target.closest('.tab').classList.add('active');
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.getElementById(tabName + '-panel').classList.add('active');
}

// ─── Load Step ───────────────────────────────────────────────────────
function loadStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= workflowSteps.length) return;
    appState.currentStep = stepIndex;
    const step = workflowSteps[stepIndex];
    renderSidebar();

    // Loan header visibility
    const loanHeader = document.getElementById('loanDetailsHeader');
    const tabsC = document.querySelector('.tabs-container');
    const tabW = document.querySelector('.tab-content-wrapper');
    if (stepIndex >= 1 && appState.loanData) {
        loanHeader.classList.add('visible'); tabsC.classList.add('with-header'); tabW.classList.add('with-header');
    } else {
        loanHeader.classList.remove('visible'); tabsC.classList.remove('with-header'); tabW.classList.remove('with-header');
    }

    // Render workflow content
    renderWorkflowContent(step, stepIndex);
    // Update checklist tab
    renderChecklistContent(step);
    // Update script tab
    renderScriptContent(step);
}

// ─── Checklist & Script Tabs ─────────────────────────────────────────
function renderChecklistContent(step) {
    const container = document.getElementById('checklistContent');
    if (!step.checklist || step.checklist.length === 0) {
        container.innerHTML = '<p style="color:#999;text-align:center;padding:40px;">No checklist for this step.</p>';
        return;
    }
    container.innerHTML = step.checklist.map((item, i) =>
        '<div class="checklist-item" id="chk-' + step.id + '-' + i + '">'
        + '<input type="checkbox" id="cb-' + step.id + '-' + i + '" onchange="toggleCheckbox(' + step.id + ',' + i + ')">'
        + '<label for="cb-' + step.id + '-' + i + '">' + item + '</label></div>'
    ).join('');
}

function toggleCheckbox(stepId, idx) {
    var el = document.getElementById('chk-' + stepId + '-' + idx);
    var cb = document.getElementById('cb-' + stepId + '-' + idx);
    if (cb.checked) el.classList.add('checked'); else el.classList.remove('checked');
}

function renderScriptContent(step) {
    document.getElementById('scriptContent').textContent = step.script || 'No agent prompt available for this step.';
}

// ─── Main Workflow Content Renderer ──────────────────────────────────
function renderWorkflowContent(step, stepIndex) {
    var content = document.getElementById('workflowContent');

    if (step.endState) { content.innerHTML = renderEndState(step); return; }

    var html = '<div class="workflow-card">'
        + '<div class="workflow-header">'
        + '<div class="step-title">' + step.icon + ' Step ' + step.id + ': ' + step.name + '</div>'
        + '<div class="step-type-badge">' + step.type.toUpperCase() + '</div>'
        + '</div>';

    // Step 1: Search
    if (step.id === 1) { html += renderStep1Search(); }
    // Step 2: Check Active LM
    else if (step.id === 2) { html += renderStep2ActiveLM(); }
    // Step 3: Eligibility Factors
    else if (step.id === 3) { html += renderStep3Eligibility(); }
    // Step 4: Retention Eligibility
    else if (step.id === 4) { html += renderStep4Retention(); }
    // Step 5: Reinstatement
    else if (step.id === 5) { html += renderStep5Reinstatement(); }
    // Step 6: Process Payment
    else if (step.id === 6) { html += renderStep6Payment(); }
    // Step 7-9, 10, 12, 14: Simple decision/info steps
    else if (step.id === 7) { html += renderStep7Intent(); }
    else if (step.id === 8) { html += renderStep8HardshipCheck(); }
    else if (step.id === 9) { html += renderStep9Surplus(); }
    else if (step.id === 10) { html += renderStep10Income(); }
    else if (step.id === 11) { html += renderStep11RPPEligibility(); }
    else if (step.id === 12) { html += renderStep12Duration(); }
    else if (step.id === 13) { html += renderStep13Forbearance(); }
    else if (step.id === 14) { html += renderStep14Affordability(); }
    else if (step.id === 15) { html += renderStep15PartialClaim(); }
    else if (step.id === 16) { html += renderStep16ModEstimates(); }
    else if (step.id === 20) { html += renderStep20RPPAccept(); }
    else if (step.id === 24) { html += renderStep24Hardship(); }
    else if (step.id === 25) { html += renderStep25ModEligibility(); }
    else {
        // Generic step with loan details
        if (appState.loanData && step.id > 1) html += renderLoanDetails();
    }

    // Decision buttons (except steps with custom decisions)
    if (step.decisions && ![1, 2, 3, 4, 24].includes(step.id)) {
        html += renderDecisionButtons(step);
    }

    // Notes
    html += renderNotesSection(step.id);

    // Navigation
    html += '<div class="button-group"><div>'
        + (stepIndex > 0 ? '<button class="btn btn-secondary" onclick="loadStep(' + (stepIndex - 1) + ')">&#8592; Previous</button>' : '')
        + '</div><div>'
        + (step.autoAdvance && !step.decisions ? '<button class="btn btn-primary" onclick="completeStep()">Continue &#8594;</button>' : '')
        + '</div></div>';

    html += '</div>';
    content.innerHTML = html;

    // Auto-advance for validation steps 3, 4
    if ((step.id === 3 || step.id === 4) && step.autoAdvance) {
        setTimeout(function () { completeStep(); loadStep(stepIndex + 1); }, 2500);
    }
    // Init hardship capture
    if (step.id === 24) { setTimeout(loadHardshipReasons, 100); }
    // Auto-fetch data from backend for certain steps
    if (step.id === 5 && appState.loanData) { fetchReinstatement(); }
    if (step.id === 15 && appState.loanData) { fetchPartialClaim(); }
    if (step.id === 16 && appState.loanData) { fetchModEstimates(); }
    if (step.id === 11 && appState.loanData) { fetchRepaymentPlan(); }
}

// ─── Step Renderers ──────────────────────────────────────────────────

function renderStep1Search() {
    return '<div class="data-section">'
        + '<div class="section-title">&#128269; Search for Loan</div>'
        + '<p style="margin-bottom:20px;color:#666;">Search by <strong>Loan Number</strong>, <strong>Borrower Name</strong>, or <strong>Property Address</strong></p>'
        + '<div style="display:flex;gap:15px;align-items:stretch;">'
        + '<input type="text" id="loanSearchInput" placeholder="e.g., 9876543210, Sarah Johnson, or 456 Oak Avenue" onkeyup="if(event.key===\'Enter\')searchLoans()" style="flex:1;padding:14px 18px;border:2px solid #ddd;border-radius:6px;font-size:15px;">'
        + '<button class="btn btn-primary" onclick="searchLoans()">&#128269; Search</button>'
        + '</div></div>'
        + '<div id="searchResults" style="margin-top:25px;min-height:100px;">'
        + '<div style="padding:40px 20px;text-align:center;color:#999;">'
        + '<div style="font-size:15px;">Enter search criteria above to find a loan</div>'
        + '<div style="font-size:13px;margin-top:8px;color:#bbb;">Try: "Sarah", "456 Oak", "9876543210", or "Springfield"</div></div></div>'
        + '<div class="summary-box" style="margin-top:20px;background:#e3f2fd;border-color:#1976d2;">'
        + '<h3 style="color:#1565c0;">&#128203; Sample Loans in Database</h3>'
        + '<ul style="color:#0d47a1;line-height:2;">'
        + '<li>Sarah Johnson - 9876543210 - Springfield, IL</li>'
        + '<li>Robert Martinez - 8765432109 - Chicago, IL</li>'
        + '<li>Jennifer Chen - 7654321098 - Austin, TX</li>'
        + '<li>David Thompson - 6543210987 - Denver, CO</li>'
        + '<li>Amanda Williams - 5432109876 - Seattle, WA</li></ul></div>';
}

function renderStep2ActiveLM() {
    var hasActive = appState.loanData && appState.loanData.activeLMApplication;
    var html = '<div class="data-section"><div class="section-title">&#128203; Active Application Check</div>'
        + '<div class="summary-box" style="background:#e3f2fd;border-color:#2196F3;margin-bottom:20px;">'
        + '<h3 style="color:#1565C0;">&#128256; Workflow Branching Point</h3>'
        + '<p style="margin-top:10px;color:#424242;">This step determines the workflow path:</p>'
        + '<div style="margin-top:15px;padding-left:20px;border-left:3px solid #2196F3;color:#424242;">'
        + '<p><strong>If Active LM Found:</strong> Workflow ends at Step 18 (Display Status)</p>'
        + '<p style="margin-top:10px;"><strong>If No Active LM:</strong> Continue to Step 3 (Eligibility Check)</p></div></div>'
        + '<div class="validation-result ' + (hasActive ? 'error' : 'success') + '">'
        + '<span class="validation-icon">' + (hasActive ? '&#10003;' : '&#8505;') + '</span>'
        + '<div class="validation-content"><strong>' + (hasActive ? 'Active Application Found' : 'No Active Applications') + '</strong>'
        + '<p>' + (hasActive ? 'An active loss mitigation application was found.' : 'No active applications found. Proceeding with new evaluation.') + '</p></div></div>';

    if (hasActive) {
        var app = appState.loanData.activeLMApplication;
        html += '<div class="summary-box" style="margin-top:20px;background:#e8f5e9;border-color:#4CAF50;">'
            + '<h3 style="color:#2e7d32;">&#128203; Active Application Details</h3>'
            + '<div style="margin-top:15px;">'
            + '<p><strong>Application Type:</strong> ' + app.applicationType + '</p>'
            + '<p><strong>Submitted:</strong> ' + app.submissionDate + '</p>'
            + '<p><strong>Status:</strong> ' + app.currentStatus + '</p>'
            + '<p><strong>Stage:</strong> ' + app.currentStage + '</p>'
            + '<p><strong>Specialist:</strong> ' + app.assignedSpecialist + ' (ext. ' + app.specialistExtension + ')</p>'
            + '<p><strong>Expected Decision:</strong> ' + app.expectedDecisionDate + '</p></div></div>';
    }

    // Decision
    var decision = hasActive
        ? { label: '&#128203; View Active Application Status', next: 18 }
        : { label: '&#9654; Continue to Eligibility Check', next: 3 };
    html += '<div class="data-section"><div class="section-title">&#127919; Next Action</div>'
        + '<div class="decision-group" style="grid-template-columns:1fr;">'
        + '<div class="decision-btn" onclick="makeDecision(' + decision.next + ')">'
        + '<div class="decision-btn-label">' + decision.label + '</div></div></div></div>';

    html += '</div>';
    if (appState.loanData) html += renderLoanDetails();
    return html;
}

function renderStep3Eligibility() {
    if (!appState.loanData) return '<p>No loan data loaded.</p>';
    var loan = appState.loanData;
    return '<div class="data-section"><div class="section-title">&#128269; Automated Eligibility Validation</div>'
        + '<div class="data-grid">'
        + dataField('Owner Occupied', '&#10003; YES', 'success')
        + dataField('Property Type', loan.propertyType)
        + dataField('FHA Insured', '&#10003; YES', 'success')
        + dataField('Foreclosure Active', '&#9888; YES', 'warning')
        + dataField('Bankruptcy', loan.bankruptcyStatus, 'success')
        + dataField('Days Delinquent', loan.daysPastDue + ' days')
        + '</div>'
        + '<div class="validation-result success" style="margin-top:20px;"><span class="validation-icon">&#10003;</span>'
        + '<div class="validation-content"><strong>Basic Eligibility Confirmed</strong>'
        + '<p>Auto-advancing to Retention Eligibility check...</p></div></div></div>';
}

function renderStep4Retention() {
    return '<div class="data-section"><div class="section-title">&#10003; General Retention Eligibility</div>'
        + '<div class="validation-result success"><span class="validation-icon">&#10003;</span>'
        + '<div class="validation-content"><strong>All Retention Criteria Met</strong>'
        + '<p>Owner occupied, foreclosure timeline met (103 days, &#8805;37 required), LTV ' + (appState.loanData ? appState.loanData.ltvRatio : '--') + '% (&#8804;200%), no prior FHA claim.</p>'
        + '<p style="margin-top:10px;">Auto-advancing to Reinstatement Option...</p></div></div></div>'
        + (appState.loanData ? renderLoanDetails() : '');
}

function renderStep5Reinstatement() {
    var html = '<div class="data-section"><div class="section-title">&#128181; Reinstatement Calculation</div>'
        + '<div id="reinstatementData"><div class="spinner"></div><p style="text-align:center;color:#666;">Loading reinstatement data from server...</p></div></div>';
    if (appState.loanData) html += renderLoanDetails();
    return html;
}

function fetchReinstatement() {
    api('/api/v1/loans/' + appState.loanData.loanId + '/reinstatement').then(function (data) {
        var el = document.getElementById('reinstatementData');
        if (!el) return;
        el.innerHTML = '<div class="data-grid">'
            + dataField('Principal Past Due', '$' + fmt(data.principalPastDue))
            + dataField('Interest Past Due', '$' + fmt(data.interestPastDue))
            + dataField('Escrow Shortage', '$' + fmt(data.escrowShortage))
            + dataField('Late Charges', '$' + fmt(data.lateCharges))
            + dataField('Foreclosure Costs', '$' + fmt(data.foreclosureCosts))
            + dataField('Attorney Fees', '$' + fmt(data.attorneyFees))
            + '</div>'
            + '<div class="summary-box" style="margin-top:20px;"><h3>Total Reinstatement Required</h3>'
            + '<div style="font-size:28px;font-weight:700;color:var(--primary-blue);">$' + fmt(data.totalReinstatement) + '</div></div>';
    });
}

function renderStep6Payment() {
    return '<div class="data-section"><div class="section-title">&#128179; Reinstatement Payment Processing</div>'
        + '<div class="summary-box" style="background:#e8f5e9;border-color:#4CAF50;"><h3 style="color:#2e7d32;">Payment Method Options</h3>'
        + '<ul style="line-height:2.5;"><li><strong>&#9889; Wire Transfer</strong> - Same day (by 2PM EST) - Recommended for urgent deadlines</li>'
        + '<li><strong>&#127974; ACH Transfer</strong> - 2-3 business days - No fee</li>'
        + '<li><strong>&#9993; Certified Check</strong> - 5-7 business days - Not recommended if deadline within 10 days</li></ul></div>'
        + '<div class="summary-box" style="background:#1e293b;color:white;font-family:monospace;margin-top:20px;">'
        + '<h3 style="color:#60a5fa;">Wire Transfer Instructions</h3>'
        + '<p style="margin-top:10px;line-height:2;">Bank: Wells Fargo Bank, N.A.<br>ABA Routing: 121000248<br>SWIFT: WFBIUS6S<br>'
        + 'Account: [Servicer Name] - Loan Servicing<br>Account #: 4025889654<br>'
        + '<span style="color:#fbbf24;">&#9888; Include loan number in wire reference<br>&#9888; Cutoff: 2:00 PM EST</span></p></div></div>';
}

function renderStep7Intent() {
    return '<div class="data-section"><div class="section-title">&#127919; Borrower Retention Intent</div>'
        + '<p style="margin-bottom:20px;font-size:15px;">Do you want to keep your property and remain in your home?</p></div>'
        + (appState.loanData ? renderLoanDetails() : '');
}

function renderStep8HardshipCheck() {
    return '<div class="data-section"><div class="section-title">&#128269; Hardship Resolution Status</div>'
        + '<p style="margin-bottom:20px;font-size:15px;">Has the hardship that caused you to fall behind on your mortgage been resolved?</p>'
        + '<div class="summary-box"><h3>Examples of RESOLVED hardship:</h3><ul>'
        + '<li>Back to work after unemployment</li><li>Medical bills paid off</li>'
        + '<li>Income restored to previous levels</li><li>Temporary issue has passed</li></ul></div></div>'
        + (appState.loanData ? renderLoanDetails() : '');
}

function renderStep9Surplus() {
    var pmt = appState.loanData ? '$' + fmt(appState.loanData.monthlyPayment) : '$[Amount]';
    return '<div class="data-section"><div class="section-title">&#128181; Surplus Income Assessment</div>'
        + '<p style="margin-bottom:20px;font-size:15px;">Can you afford to pay MORE than your regular monthly payment of ' + pmt + ' to catch up?</p></div>'
        + (appState.loanData ? renderLoanDetails() : '');
}

function renderStep10Income() {
    return '<div class="data-section"><div class="section-title">&#128202; Income & Expense Collection</div>'
        + '<div class="form-field"><label>Monthly Gross Income</label><input type="number" id="monthlyIncome" value="4800" placeholder="Enter amount"></div>'
        + '<div class="form-field"><label>Employment Status</label><select id="employmentStatus">'
        + '<option value="employed" selected>Employed</option><option value="self-employed">Self-Employed</option>'
        + '<option value="unemployed">Unemployed</option><option value="retired">Retired</option></select></div>'
        + '<div class="summary-box"><h3>Required Documents</h3><ul>'
        + '<li>Recent pay stubs (last 2 months)</li><li>Bank statements (last 2 months)</li>'
        + '<li>Hardship affidavit</li><li>Proof of occupancy</li></ul></div></div>';
}

function renderStep11RPPEligibility() {
    return '<div class="data-section"><div class="section-title">&#128197; FHA Repayment Plan Eligibility</div>'
        + '<div id="rppEligData"><div class="spinner"></div><p style="text-align:center;color:#666;">Validating eligibility from server...</p></div></div>'
        + '<div class="data-section"><div class="section-title">&#128197; Repayment Plan Terms</div>'
        + '<div id="rppTermsData"><div class="spinner"></div></div></div>'
        + (appState.loanData ? renderLoanDetails() : '');
}

function fetchRepaymentPlan() {
    // Eligibility
    api('/api/v1/loans/' + appState.loanData.loanId + '/eligibility/repayment').then(function (data) {
        var el = document.getElementById('rppEligData');
        if (!el) return;
        el.innerHTML = renderEligibilityChecks(data);
    });
    // Terms
    api('/api/v1/loans/' + appState.loanData.loanId + '/repayment-plan').then(function (data) {
        var el = document.getElementById('rppTermsData');
        if (!el) return;
        el.innerHTML = '<div class="data-grid">'
            + dataField('Plan Duration', data.termMonths + ' months')
            + dataField('Regular Payment', '$' + fmt(data.regularPayment))
            + dataField('Additional Amount', '$' + fmt(data.additionalPayment), 'warning')
            + dataField('Total Monthly Payment', '$' + fmt(data.totalPayment), 'success')
            + '</div>';
    });
}

function renderStep12Duration() {
    return '<div class="data-section"><div class="section-title">&#9201; Hardship Duration Assessment</div>'
        + '<p style="margin-bottom:15px;font-size:15px;">Is the financial hardship:</p>'
        + '<div class="summary-box"><h3>SHORT-TERM: Temporary (3-6 months)</h3><p>Examples: Temporary job loss, one-time medical expense</p></div>'
        + '<div class="summary-box"><h3>LONG-TERM: Ongoing or permanent</h3><p>Examples: Permanent income reduction, disability, divorce</p></div></div>';
}

function renderStep13Forbearance() {
    return '<div class="data-section"><div class="section-title">&#9199; FHA Forbearance Eligibility</div>'
        + '<div id="forbEligData"><div class="spinner"></div><p style="text-align:center;color:#666;">Validating forbearance eligibility...</p></div></div>'
        + '<div class="data-section"><div class="section-title">&#128161; Forbearance Payment Options</div>'
        + '<div class="data-grid">'
        + '<div class="data-field" style="border-left-color:#f59e0b;"><div class="field-label">Option 1: Full Suspension</div><div class="field-value success">$0/month for 6 months</div><div style="font-size:12px;color:#666;margin-top:5px;">Best for: Complete temporary hardship</div></div>'
        + '<div class="data-field" style="border-left-color:#3b82f6;"><div class="field-label">Option 2: Partial Payment (50%)</div><div class="field-value warning">$' + (appState.loanData ? fmt(appState.loanData.monthlyPayment / 2) : '--') + '/month for 6 months</div><div style="font-size:12px;color:#666;margin-top:5px;">Best for: Reduced income situations</div></div>'
        + '</div></div>'
        + (appState.loanData ? renderLoanDetails() : '');
}

function renderStep14Affordability() {
    var pmt = appState.loanData ? '$' + fmt(appState.loanData.monthlyPayment) : '$[Amount]';
    return '<div class="data-section"><div class="section-title">&#128178; Payment Affordability Assessment</div>'
        + '<p style="margin-bottom:20px;font-size:15px;">Can you afford your current monthly payment of ' + pmt + ' going forward?</p>'
        + '<div class="summary-box"><h3>Routing Logic</h3><ul>'
        + '<li><strong>YES:</strong> Explore Partial Claim (keeps payment same, deals with arrears)</li>'
        + '<li><strong>NO:</strong> Reduce payment via Modification</li></ul></div></div>'
        + (appState.loanData ? renderLoanDetails() : '');
}

function renderStep15PartialClaim() {
    return '<div class="data-section"><div class="section-title">&#128279; FHA Partial Claim</div>'
        + '<div id="partialClaimData"><div class="spinner"></div><p style="text-align:center;color:#666;">Evaluating partial claim eligibility from server...</p></div></div>'
        + (appState.loanData ? renderLoanDetails() : '');
}

function fetchPartialClaim() {
    api('/api/v1/loans/' + appState.loanData.loanId + '/partial-claim').then(function (data) {
        var el = document.getElementById('partialClaimData');
        if (!el) return;
        if (data.eligible) {
            el.innerHTML = '<div class="validation-result success"><span class="validation-icon">&#10003;</span>'
                + '<div class="validation-content"><strong>Eligible for FHA Partial Claim</strong><p>All criteria met.</p></div></div>'
                + '<div class="data-grid">'
                + dataField('Partial Claim Amount', '$' + fmt(data.amount), 'success')
                + dataField('Interest Rate', '0.00% (Interest-Free!)')
                + dataField('Monthly Payment', '$0')
                + dataField('% of UPB', data.percentOfUPB + '%')
                + '</div>'
                + '<div class="summary-box" style="margin-top:20px;"><h3>After Partial Claim</h3><ul>'
                + '<li>First mortgage: Current status</li>'
                + '<li>Regular payment: $' + fmt(appState.loanData.monthlyPayment) + '/month</li>'
                + '<li>Foreclosure: Dismissed</li>'
                + '<li>PC repaid at: Sale/Refinance/Payoff</li></ul></div>';
        } else {
            el.innerHTML = '<div class="validation-result error"><span class="validation-icon">&#10007;</span>'
                + '<div class="validation-content"><strong>Not Eligible for Partial Claim</strong>'
                + '<p>' + data.ineligibleReason + '</p></div></div>';
        }
    });
}

function renderStep16ModEstimates() {
    return '<div class="data-section"><div class="section-title">&#128202; FHA Modification Waterfall</div>'
        + '<div class="summary-box" style="background:#fff3cd;border-color:#856404;margin-bottom:20px;">'
        + '<h3 style="color:#856404;">&#9888; Important Disclaimers</h3>'
        + '<ul style="color:#856404;"><li>These are ESTIMATES ONLY - not guaranteed terms</li>'
        + '<li>Programs evaluated in waterfall order per FHA guidelines</li>'
        + '<li>Final terms determined after NPV test</li>'
        + '<li>Requires successful 3-month Trial Payment Plan</li></ul></div>'
        + '<div id="modEstData"><div class="spinner"></div><p style="text-align:center;color:#666;">Loading modification estimates from server...</p></div></div>'
        + (appState.loanData ? renderLoanDetails() : '');
}

function fetchModEstimates() {
    var isDisaster = appState.hardshipState.isDisaster || false;
    api('/api/v1/loans/' + appState.loanData.loanId + '/modification-estimates?isDisaster=' + isDisaster).then(function (data) {
        var el = document.getElementById('modEstData');
        if (!el) return;
        var html = '';
        data.forEach(function (category) {
            html += '<h3 style="color:var(--primary-blue);padding:12px 15px;background:linear-gradient(135deg,#e3f2fd,#bbdefb);border-radius:8px;margin-bottom:15px;">' + category.category + '</h3>';
            category.options.forEach(function (opt, i) {
                var borderColor = opt.paymentSupplement ? '#9c27b0' : (opt.partialClaim ? '#2196f3' : '#4caf50');
                html += '<div class="workflow-card" style="background:white;margin-bottom:12px;border-left:4px solid ' + borderColor + ';">'
                    + '<h4 style="color:var(--primary-blue);margin-bottom:6px;">' + (i + 1) + '. ' + opt.name + '</h4>'
                    + '<p style="font-size:12px;color:#666;margin-bottom:10px;">' + opt.description + '</p>'
                    + '<div class="data-grid">'
                    + dataField('Interest Rate', opt.rate ? opt.rate.toFixed(2) + '%' : 'Current')
                    + dataField('New Term', opt.termDisplay)
                    + dataField('Est. Payment', '$' + fmt(opt.payment), 'success')
                    + dataField('Monthly Savings', '$' + fmt(opt.savings), 'success')
                    + '</div>';
                if (opt.partialClaim) {
                    html += '<div style="margin-top:12px;padding:10px 12px;background:#e3f2fd;border-radius:6px;border-left:3px solid #2196f3;">'
                        + '<div style="font-size:11px;font-weight:600;color:#1565c0;">Partial Claim Component</div>'
                        + '<div style="font-size:12px;color:#0d47a1;">Amount: <strong>$' + fmt(opt.partialClaimAmount) + '</strong> | 0% interest | Due at sale/payoff</div></div>';
                }
                if (opt.paymentSupplement) {
                    html += '<div style="margin-top:12px;padding:10px 12px;background:#f3e5f5;border-radius:6px;border-left:3px solid #9c27b0;">'
                        + '<div style="font-size:11px;font-weight:600;color:#6a1b9a;">HUD Payment Supplement</div>'
                        + '<div style="font-size:12px;color:#4a148c;">HUD pays: <strong>$' + fmt(opt.supplementAmount) + '/month</strong></div></div>';
                }
                html += '</div>';
            });
        });
        el.innerHTML = html;
    });
}

function renderStep20RPPAccept() {
    if (!appState.loanData) return '<p>No loan data.</p>';
    var loan = appState.loanData;
    var additional = Math.round(Number(loan.totalDelinquency) / 12);
    var total = Number(loan.monthlyPayment) + additional;
    return '<div class="data-section"><div class="section-title">&#9989; Repayment Plan Terms</div>'
        + '<div style="background:linear-gradient(135deg,#f0f9ff,#e0f2fe);padding:25px;border-radius:12px;border-left:5px solid #3b82f6;">'
        + '<div style="font-size:18px;margin-bottom:15px;">&#128176; Regular Monthly Payment: <strong>$' + fmt(loan.monthlyPayment) + '</strong></div>'
        + '<div style="font-size:18px;margin-bottom:15px;">&#10133; Additional Amount: <strong>$' + fmt(additional) + '</strong></div>'
        + '<div style="border-top:3px solid #3b82f6;padding-top:15px;margin-top:15px;">'
        + '<div style="font-size:22px;font-weight:700;color:#1e40af;">&#128181; Total Monthly: $' + fmt(total) + '</div></div>'
        + '<div style="margin-top:15px;font-size:14px;color:#64748b;">&#128197; Duration: 12 months | Total Arrears: $' + fmt(loan.totalDelinquency) + '</div>'
        + '</div></div>'
        + (appState.loanData ? renderLoanDetails() : '');
}

function renderStep24Hardship() {
    return '<div class="data-section"><div class="section-title">&#128202; Reason for Default - Hardship Capture</div>'
        + '<div id="hardshipCaptureContainer"><div class="spinner"></div><p style="text-align:center;color:#666;">Loading hardship reasons from server...</p></div></div>';
}

function renderStep25ModEligibility() {
    return '<div class="data-section"><div class="section-title">&#9989; FHA Modification Eligibility</div>'
        + '<div class="validation-result success"><span class="validation-icon">&#10003;</span>'
        + '<div class="validation-content"><strong>All Modification Criteria Met</strong>'
        + '<p>Owner occupied, income qualified, property condition acceptable, no prior modifications in past 24 months.</p></div></div></div>'
        + (appState.loanData ? renderLoanDetails() : '');
}

// ─── Hardship Capture (API-driven) ───────────────────────────────────
function loadHardshipReasons() {
    api('/api/v1/hardship/reasons').then(function (data) {
        var container = document.getElementById('hardshipCaptureContainer');
        if (!container) return;
        var html = '<h3 style="margin-bottom:20px;color:var(--primary-blue);">Select the Reason for Default:</h3>';

        // Temporary
        html += '<div style="background:linear-gradient(135deg,#fff3e0,#ffe0b2);padding:15px 20px;border-radius:8px;border-left:5px solid #ff9800;margin-bottom:15px;">'
            + '<div style="font-size:15px;font-weight:700;color:#e65100;">&#9201; SHORT-TERM HARDSHIPS (Temporary)</div>'
            + '<div style="font-size:12px;color:#bf360c;">Short-term situations expected to resolve</div></div>';
        html += '<div class="hardship-grid">';
        data.temporary.forEach(function (item) {
            html += '<div class="hardship-card" onclick="selectHardshipReason(\'' + escAttr(item.reason) + '\',\'Temporary\')">'
                + '<div style="font-size:15px;font-weight:600;color:#e65100;">' + item.reason + '</div>'
                + '<div style="font-size:11px;color:#666;margin-top:5px;">' + item.questions.length + ' questions</div></div>';
        });
        html += '</div>';

        // Permanent
        html += '<div style="background:linear-gradient(135deg,#fce4ec,#f8bbd0);padding:15px 20px;border-radius:8px;border-left:5px solid #e91e63;margin:20px 0 15px;">'
            + '<div style="font-size:15px;font-weight:700;color:#880e4f;">&#128204; LONG-TERM HARDSHIPS (Permanent)</div>'
            + '<div style="font-size:12px;color:#ad1457;">Long-term or ongoing situations</div></div>';
        html += '<div class="hardship-grid">';
        data.permanent.forEach(function (item) {
            html += '<div class="hardship-card permanent" onclick="selectHardshipReason(\'' + escAttr(item.reason) + '\',\'Permanent\')">'
                + '<div style="font-size:15px;font-weight:600;color:#880e4f;">' + item.reason + '</div>'
                + '<div style="font-size:11px;color:#666;margin-top:5px;">' + item.questions.length + ' questions</div></div>';
        });
        html += '</div>';

        html += '<div class="summary-box" style="background:#e3f2fd;border-color:#2196f3;margin-top:25px;">'
            + '<h3 style="color:#1565c0;">&#128161; How It Works</h3>'
            + '<ul style="color:#0d47a1;line-height:2;">'
            + '<li>Select the reason that best describes the situation</li>'
            + '<li>System automatically categorizes as Temporary or Permanent</li>'
            + '<li>Answer 4 customized questions</li>'
            + '<li>System auto-routes: Short-term&#8594;Forbearance, Long-term&#8594;Partial Claim</li></ul></div>';

        container.innerHTML = html;
    });
}

function selectHardshipReason(reason, category) {
    appState.hardshipState.reason = reason;
    appState.hardshipState.category = category;
    appState.hardshipState.hardshipType = category === 'Temporary' ? 'Short-term' : 'Long-term';
    appState.hardshipState.isDisaster = (reason === 'Natural Disaster');
    appState.hardshipState.answers = [];

    api('/api/v1/hardship/reason?reason=' + encodeURIComponent(reason) + '&category=' + encodeURIComponent(category))
        .then(function (data) {
            var container = document.getElementById('hardshipCaptureContainer');
            var html = '<div style="margin-bottom:20px;"><button class="btn btn-secondary" onclick="loadHardshipReasons()" style="padding:8px 16px;font-size:13px;">&#8592; Back to Reasons</button></div>';

            html += '<div style="background:linear-gradient(135deg,#e8f5e9,#c8e6c9);padding:20px;border-radius:10px;margin-bottom:25px;border-left:5px solid #4caf50;">'
                + '<div style="font-size:13px;font-weight:600;color:#2e7d32;">REASON FOR DEFAULT</div>'
                + '<div style="display:flex;gap:20px;align-items:center;margin-top:8px;">'
                + '<div><div style="font-size:11px;color:#1b5e20;">Category</div><div style="font-size:16px;font-weight:700;color:#1b5e20;">' + category + '</div></div>'
                + '<div style="font-size:24px;color:#4caf50;">&#8594;</div>'
                + '<div><div style="font-size:11px;color:#1b5e20;">Reason</div><div style="font-size:16px;font-weight:700;color:#1b5e20;">' + reason + '</div></div></div></div>';

            html += '<h3 style="margin-bottom:20px;color:var(--primary-blue);">Please answer the following questions:</h3>';

            data.questions.forEach(function (q, i) {
                html += '<div style="background:white;padding:20px;border:2px solid #e0e0e0;border-radius:8px;margin-bottom:15px;">'
                    + '<div style="font-weight:600;color:#1976d2;margin-bottom:12px;font-size:15px;">' + q.seq + '. ' + q.question + '</div>'
                    + '<textarea id="hardship_answer_' + i + '" onchange="appState.hardshipState.answers[' + i + ']=this.value" placeholder="Enter response here..." '
                    + 'style="width:100%;padding:12px;border:2px solid #ddd;border-radius:6px;font-size:14px;min-height:80px;font-family:inherit;"></textarea></div>';
            });

            html += '<div style="margin-top:30px;text-align:center;">'
                + '<button class="btn btn-primary" onclick="completeHardshipCapture(' + data.questions.length + ')" style="padding:14px 40px;font-size:16px;font-weight:600;">Complete Hardship Capture &#8594;</button></div>';

            container.innerHTML = html;
        });
}

function completeHardshipCapture(questionCount) {
    for (var i = 0; i < questionCount; i++) {
        if (!appState.hardshipState.answers[i] || appState.hardshipState.answers[i].trim() === '') {
            alert('Please answer question ' + (i + 1) + ' before proceeding.');
            return;
        }
    }

    var category = appState.hardshipState.category;
    var nextStepId = category === 'Permanent' ? 15 : 13;
    var nextStepName = category === 'Permanent' ? 'Partial Claim' : 'Forbearance';
    var nextIndex = stepIdToIndex[nextStepId];

    var container = document.getElementById('hardshipCaptureContainer');
    container.innerHTML = '<div style="background:linear-gradient(135deg,#4caf50,#388e3c);color:white;padding:30px;border-radius:12px;text-align:center;">'
        + '<div style="font-size:56px;margin-bottom:15px;">&#10003;</div>'
        + '<div style="font-size:22px;font-weight:700;margin-bottom:15px;">Reason for Default Captured</div>'
        + '<div style="background:rgba(255,255,255,0.2);padding:15px;border-radius:8px;margin-bottom:20px;">'
        + '<div style="font-size:14px;opacity:0.95;margin-bottom:8px;"><strong>Hardship Type:</strong> ' + appState.hardshipState.hardshipType + '</div>'
        + '<div style="font-size:14px;opacity:0.95;margin-bottom:8px;"><strong>Category:</strong> ' + category + '</div>'
        + '<div style="font-size:14px;opacity:0.95;"><strong>Reason:</strong> ' + appState.hardshipState.reason + '</div></div>'
        + '<div style="background:rgba(255,255,255,0.15);padding:12px;border-radius:6px;margin-bottom:15px;">'
        + '<div style="font-size:13px;opacity:0.9;margin-bottom:5px;">Routing Logic:</div>'
        + '<div style="font-size:12px;opacity:0.85;margin-bottom:8px;">'
        + (appState.hardshipState.hardshipType === 'Long-term' ? '&#128204; Long-term Hardship &#8594; Partial Claim' : '&#9201; Short-term Hardship &#8594; Forbearance')
        + '</div>'
        + '<div style="font-size:16px;font-weight:700;">Next: ' + nextStepName + '</div></div>'
        + '<div style="font-size:14px;opacity:0.9;">Auto-advancing in 2 seconds...</div></div>';

    setTimeout(function () {
        completeStep();
        if (nextIndex !== undefined) loadStep(nextIndex);
    }, 2000);
}

// ─── Search (API-driven) ─────────────────────────────────────────────
function searchLoans() {
    var input = document.getElementById('loanSearchInput');
    var term = input.value.trim();
    if (term.length < 2) {
        document.getElementById('searchResults').innerHTML = '<div style="padding:15px;color:#666;text-align:center;">Enter at least 2 characters to search...</div>';
        return;
    }

    api('/api/v1/loans/search?term=' + encodeURIComponent(term)).then(function (results) {
        var container = document.getElementById('searchResults');
        if (results.length === 0) {
            container.innerHTML = '<div style="padding:20px;text-align:center;color:#666;"><div style="font-size:16px;font-weight:600;">No loans found</div><div style="font-size:13px;margin-top:5px;">Try searching by loan number, borrower name, or property address</div></div>';
            return;
        }
        var html = '<div style="margin-bottom:15px;padding:10px;background:#e3f2fd;border-radius:6px;font-size:13px;color:#1565c0;">Found ' + results.length + ' matching loan' + (results.length > 1 ? 's' : '') + '</div>';
        results.forEach(function (result) {
            var loan = result.loan;
            html += '<div class="search-result-item" onclick="selectLoan(\'' + loan.loanId + '\')">'
                + '<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:10px;">'
                + '<div><div style="font-size:16px;font-weight:700;color:#1976d2;margin-bottom:4px;">' + loan.borrowerName + '</div>'
                + '<div style="font-size:12px;color:#666;margin-bottom:2px;">Loan #: ' + loan.loanAccountNumber + '</div>'
                + '<div style="font-size:12px;color:#666;">&#128205; ' + loan.propertyAddress + '</div></div>'
                + '<div style="background:' + result.scoreColor + ';color:white;padding:4px 10px;border-radius:12px;font-size:10px;font-weight:600;white-space:nowrap;">' + result.matchType + '</div></div>'
                + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:10px;padding-top:10px;border-top:1px solid #f0f0f0;">'
                + '<div><div style="font-size:10px;color:#999;text-transform:uppercase;">Delinquent</div><div style="font-size:13px;font-weight:600;color:#d32f2f;">' + loan.daysPastDue + ' days</div></div>'
                + '<div><div style="font-size:10px;color:#999;text-transform:uppercase;">Past Due</div><div style="font-size:13px;font-weight:600;color:#d32f2f;">$' + fmt(loan.totalDelinquency) + '</div></div>'
                + '<div><div style="font-size:10px;color:#999;text-transform:uppercase;">UPB</div><div style="font-size:13px;font-weight:600;">$' + fmt(loan.unpaidPrincipal) + '</div></div></div></div>';
        });
        container.innerHTML = html;
    });
}

function selectLoan(loanId) {
    api('/api/v1/loans/' + loanId).then(function (loan) {
        appState.loanData = loan;
        populateLoanHeader(loan);
        document.getElementById('searchResults').innerHTML = '<div style="background:linear-gradient(135deg,#4caf50,#388e3c);color:white;padding:25px;border-radius:12px;text-align:center;">'
            + '<div style="font-size:48px;margin-bottom:10px;">&#10003;</div>'
            + '<div style="font-size:20px;font-weight:700;margin-bottom:8px;">Loan Loaded Successfully</div>'
            + '<div style="font-size:14px;opacity:0.95;margin-bottom:20px;">' + loan.borrowerName + ' - Loan #' + loan.loanAccountNumber + '</div>'
            + '<button class="btn btn-primary" onclick="proceedFromLoanFetch()" style="background:white;color:#4caf50;border:none;padding:12px 30px;font-size:14px;font-weight:600;border-radius:6px;cursor:pointer;">Continue to Next Step &#8594;</button></div>';
    });
}

function proceedFromLoanFetch() {
    completeStep();
    loadStep(1); // Step 2 index
}

function populateLoanHeader(loan) {
    var grid = document.getElementById('loanInfoGrid');
    grid.innerHTML = '<div class="loan-info-item"><span class="loan-info-label">Loan:</span><span class="loan-info-value">' + loan.loanAccountNumber + '</span></div>'
        + '<div class="loan-info-item"><span class="loan-info-label">Borrower:</span><span class="loan-info-value">' + loan.borrowerName + '</span></div>'
        + '<div class="loan-info-item"><span class="loan-info-label">Property:</span><span class="loan-info-value">' + (loan.shortAddress || loan.propertyAddress) + '</span></div>'
        + '<div class="loan-info-item"><span class="loan-info-label">DPD:</span><span class="loan-info-value warning">' + loan.daysPastDue + 'd</span></div>'
        + '<div class="loan-info-item"><span class="loan-info-label">Delinquent:</span><span class="loan-info-value error">$' + fmt(loan.totalDelinquency) + '</span></div>'
        + '<div class="loan-info-item"><span class="loan-info-label">Status:</span><span class="status-badge active">' + loan.foreclosureStatus + '</span></div>';
}

// ─── End State Renderer ──────────────────────────────────────────────
function renderEndState(step) {
    var icons = { success: '&#127881;', 'payment-collection': '&#128179;', pending: '&#9203;', info: '&#8505;&#65039;', liquidation: '&#127960;' };
    var titles = { success: 'Workflow Complete!', 'payment-collection': 'Payment Processed Successfully!', pending: 'Application Submitted', info: 'Active Application Status Provided', liquidation: 'Liquidation Counseling Complete' };
    var messages = {
        success: 'The retention solution has been successfully set up. All necessary actions have been completed.',
        'payment-collection': 'Reinstatement payment has been processed. The account will be brought current and foreclosure will be dismissed.',
        pending: 'The modification application has been submitted to the specialist team for review.',
        info: 'Active loss mitigation application status has been provided to the borrower.',
        liquidation: 'Liquidation options have been explained and the borrower has been routed to the appropriate team.'
    };
    var type = step.endStateType || 'success';

    var html = '<div class="end-state-card">'
        + '<div class="end-state-icon">' + (icons[type] || '&#10003;') + '</div>'
        + '<div class="end-state-title">' + (titles[type] || 'Complete') + '</div>'
        + '<div class="end-state-message">' + (messages[type] || 'Workflow step completed.') + '</div>';

    // Liquidation waterfall details
    if (step.id === 19) {
        html += '<div style="background:rgba(255,255,255,0.15);border-radius:12px;padding:30px;margin:30px auto;max-width:900px;text-align:left;">'
            + '<h3 style="color:white;margin-bottom:20px;text-align:center;font-size:20px;font-weight:700;">FHA Liquidation Waterfall</h3>'
            + renderLiquidationOption(1, 'Pre-Foreclosure Sale (Short Sale)', '$2,000', '3-6 months', '-100 to -150 pts', '2-3 years', '#22c55e')
            + renderLiquidationOption(2, 'Deed-in-Lieu of Foreclosure', '$2,000', '1-2 months', '-125 to -175 pts', '3-4 years', '#3b82f6')
            + renderLiquidationOption(3, 'Foreclosure (Last Resort)', '$0', '6-18 months', '-200 to -250 pts', '7+ years', '#ef4444')
            + '</div>';
    }

    // Active LM Status details (Step 18)
    if (step.id === 18 && appState.loanData && appState.loanData.activeLMApplication) {
        var app = appState.loanData.activeLMApplication;
        html += '<div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:25px;margin:30px auto;max-width:600px;text-align:left;">'
            + '<h3 style="color:white;margin-bottom:20px;text-align:center;">&#128203; Application Details</h3>'
            + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;">'
            + '<div><div style="font-size:12px;opacity:0.8;">Type</div><div style="font-size:16px;font-weight:600;">' + app.applicationType + '</div></div>'
            + '<div><div style="font-size:12px;opacity:0.8;">Submitted</div><div style="font-size:16px;font-weight:600;">' + app.submissionDate + '</div></div>'
            + '<div><div style="font-size:12px;opacity:0.8;">Status</div><div style="font-size:16px;font-weight:600;">' + app.currentStatus + '</div></div>'
            + '<div><div style="font-size:12px;opacity:0.8;">Stage</div><div style="font-size:16px;font-weight:600;">' + app.currentStage + '</div></div>'
            + '</div>'
            + '<div style="border-top:1px solid rgba(255,255,255,0.2);padding-top:15px;margin-top:15px;">'
            + '<div style="font-size:12px;opacity:0.8;">Specialist</div><div style="font-size:16px;font-weight:600;">' + app.assignedSpecialist + ' (ext. ' + app.specialistExtension + ')</div>'
            + '<div style="font-size:12px;opacity:0.8;margin-top:10px;">Expected Decision</div><div style="font-size:16px;font-weight:600;">' + app.expectedDecisionDate + '</div>'
            + '</div></div>';
    }

    html += '<div style="margin-top:30px;">'
        + '<button class="btn btn-primary" onclick="startNewWorkflow()" style="background:linear-gradient(135deg,#4CAF50,#45a049);padding:16px 40px;font-size:16px;">&#128260; Start New Case</button>'
        + '<p style="font-size:13px;opacity:0.8;margin-top:15px;">Click to return to the initial screen</p></div></div>';

    return html;
}

function renderLiquidationOption(priority, name, relocation, timeline, credit, recovery, color) {
    return '<div style="background:' + color + ';border-radius:10px;padding:20px;margin-bottom:20px;">'
        + '<div style="display:flex;align-items:center;gap:12px;margin-bottom:15px;">'
        + '<div style="background:rgba(255,255,255,0.3);width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;">' + priority + '</div>'
        + '<div style="font-size:18px;font-weight:700;">' + name + '</div></div>'
        + '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;">'
        + '<div style="background:rgba(255,255,255,0.15);padding:12px;border-radius:6px;"><div style="font-size:11px;opacity:0.85;">Relocation</div><div style="font-size:16px;font-weight:700;">' + relocation + '</div></div>'
        + '<div style="background:rgba(255,255,255,0.15);padding:12px;border-radius:6px;"><div style="font-size:11px;opacity:0.85;">Timeline</div><div style="font-size:16px;font-weight:700;">' + timeline + '</div></div>'
        + '<div style="background:rgba(255,255,255,0.15);padding:12px;border-radius:6px;"><div style="font-size:11px;opacity:0.85;">Credit Impact</div><div style="font-size:16px;font-weight:700;">' + credit + '</div></div>'
        + '<div style="background:rgba(255,255,255,0.15);padding:12px;border-radius:6px;"><div style="font-size:11px;opacity:0.85;">Recovery</div><div style="font-size:16px;font-weight:700;">' + recovery + '</div></div>'
        + '</div></div>';
}

// ─── Reusable Renderers ──────────────────────────────────────────────
function renderLoanDetails() {
    if (!appState.loanData) return '';
    var loan = appState.loanData;
    return '<div class="data-section"><div class="section-title">&#128176; Current Loan Details</div>'
        + '<div class="data-grid">'
        + dataField('Unpaid Principal', '$' + fmt(loan.unpaidPrincipal))
        + dataField('Monthly Payment', '$' + fmt(loan.monthlyPayment))
        + dataField('Days Past Due', loan.daysPastDue, 'error')
        + dataField('Total Delinquency', '$' + fmt(loan.totalDelinquency), 'error')
        + '</div></div>';
}

function renderDecisionButtons(step) {
    if (!step.decisions || step.decisions.length === 0) return '';
    var html = '<div class="data-section"><div class="section-title">&#127919; Make Decision</div><div class="decision-group">';
    step.decisions.forEach(function (d) {
        var cls = 'decision-btn';
        var badge = '';
        if (d.recommended === true) {
            cls += ' recommended';
            badge = '<div style="position:absolute;top:-12px;right:15px;background:#4CAF50;color:white;padding:4px 12px;border-radius:12px;font-size:10px;font-weight:700;">&#11088; RECOMMENDED</div>';
        } else if (d.recommended === false) {
            cls += ' not-recommended';
        }
        html += '<div class="' + cls + '" onclick="makeDecision(' + d.next + ')" style="position:relative;">'
            + badge
            + '<div class="decision-btn-label">' + d.label + '</div></div>';
    });
    html += '</div></div>';
    return html;
}

function renderNotesSection(stepId) {
    return '<div class="notes-section"><div class="section-title" style="color:#92400e;">&#128221; Agent Notes</div>'
        + '<p style="font-size:13px;color:#78350f;margin-bottom:12px;">Document important details, borrower statements, or observations</p>'
        + '<textarea id="stepNotes_' + stepId + '" placeholder="Enter notes for this step..." onchange="appState.stepNotes[' + stepId + ']=this.value" '
        + 'style="width:100%;min-height:100px;padding:14px;border:2px solid #fbbf24;border-radius:8px;font-size:14px;font-family:inherit;resize:vertical;background:white;">'
        + (appState.stepNotes[stepId] || '') + '</textarea>'
        + '<div style="font-size:11px;color:#92400e;margin-top:8px;">&#128161; Notes are saved and will be included in the case record</div></div>';
}

function renderEligibilityChecks(data) {
    var html = '<div class="validation-result ' + (data.eligible ? 'success' : 'error') + '">'
        + '<span class="validation-icon">' + (data.eligible ? '&#10003;' : '&#10007;') + '</span>'
        + '<div class="validation-content"><strong>' + data.summary + '</strong>'
        + '<p>' + data.message + '</p>';

    if (data.categories) {
        data.categories.forEach(function (cat) {
            html += '<div style="margin-top:20px;"><div style="font-size:15px;font-weight:700;color:#1f2937;margin-bottom:12px;border-bottom:2px solid #3b82f6;padding-bottom:6px;">' + cat.name + '</div>';
            cat.checks.forEach(function (check) {
                var passed = check.status === 'pass';
                html += '<div style="background:' + (passed ? '#f0fdf4' : '#fef2f2') + ';border-left:4px solid ' + (passed ? '#10b981' : '#ef4444') + ';padding:12px 15px;margin-bottom:10px;border-radius:6px;">'
                    + '<div style="display:flex;align-items:start;gap:10px;">'
                    + '<div style="font-size:20px;">' + (passed ? '&#10003;' : '&#10007;') + '</div>'
                    + '<div style="flex:1;"><div style="font-weight:600;font-size:13px;color:#1f2937;margin-bottom:4px;">' + check.name + '</div>'
                    + '<div style="font-size:12px;color:#6b7280;">' + check.details + '</div>'
                    + '<div style="font-size:10px;background:white;padding:6px 10px;border-radius:4px;border:1px solid #e5e7eb;color:#4b5563;font-style:italic;margin-top:6px;">Requirement: ' + check.requirement + '</div>'
                    + '</div></div></div>';
            });
            html += '</div>';
        });
    }
    html += '</div></div>';
    return html;
}

function dataField(label, value, cls) {
    return '<div class="data-field"><div class="field-label">' + label + '</div><div class="field-value' + (cls ? ' ' + cls : '') + '">' + value + '</div></div>';
}

// ─── Workflow Navigation ─────────────────────────────────────────────
function makeDecision(nextStepId) {
    completeStep();
    var nextIndex = stepIdToIndex[nextStepId];
    if (nextIndex !== undefined && nextIndex >= 0) loadStep(nextIndex);
}

function completeStep() {
    if (!appState.completedSteps.includes(appState.currentStep)) {
        appState.completedSteps.push(appState.currentStep);
    }
    renderSidebar();
}

function startNewWorkflow() {
    appState.currentStep = 0;
    appState.completedSteps = [];
    appState.loanData = null;
    appState.stepNotes = {};
    appState.hardshipState = { category: null, hardshipType: null, reason: null, answers: [], isDisaster: false };

    document.getElementById('loanDetailsHeader').classList.remove('visible');
    document.querySelector('.tabs-container').classList.remove('with-header');
    document.querySelector('.tab-content-wrapper').classList.remove('with-header');
    document.getElementById('loanInfoGrid').innerHTML = '';

    renderSidebar();
    loadStep(0);
    window.scrollTo(0, 0);
}

// ─── Utility ─────────────────────────────────────────────────────────
function fmt(n) {
    if (n === null || n === undefined) return '--';
    return Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function escAttr(s) {
    return s.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// ─── Init ────────────────────────────────────────────────────────────
window.onload = initApp;
