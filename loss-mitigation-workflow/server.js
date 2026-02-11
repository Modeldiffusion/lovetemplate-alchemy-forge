/**
 * Loss Mitigation Collections Workflow - Node.js Express Server
 * Mirrors the Spring Boot backend API for local development
 */
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'src/main/resources/static')));

// ─── Loan Database ──────────────────────────────────────────────────
const loans = [
    {
        id: 1, loanId: 'LN-2024-001234', loanAccountNumber: '9876543210',
        borrowerName: 'Sarah Johnson', coborrowerName: 'Michael Johnson',
        ssn: '***-**-7890', propertyAddress: '456 Oak Avenue, Springfield, IL 62701',
        unpaidPrincipal: 285000.00, monthlyPayment: 2150.00, escrowPayment: 425.00,
        interestRate: 6.25, daysPastDue: 95, monthsDelinquent: 3,
        totalDelinquency: 6450.00, principalPastDue: 3600.00, interestPastDue: 1950.00,
        escrowShortage: 600.00, lateCharges: 300.00,
        occupancyStatus: 'Owner Occupied', propertyType: 'Single Family',
        fhaInsured: true, foreclosureStatus: 'Active',
        foreclosureSaleDate: '2025-05-20', bankruptcyStatus: 'None',
        propertyValue: 365000.00, ltvRatio: 78.08,
        shortAddress: '456 Oak Ave, Springfield, IL',
        activeLMApplication: null
    },
    {
        id: 2, loanId: 'LN-2024-002456', loanAccountNumber: '8765432109',
        borrowerName: 'Robert Martinez', coborrowerName: 'Maria Martinez',
        ssn: '***-**-5432', propertyAddress: '123 Maple Street, Chicago, IL 60601',
        unpaidPrincipal: 320000.00, monthlyPayment: 2400.00, escrowPayment: 500.00,
        interestRate: 5.75, daysPastDue: 120, monthsDelinquent: 4,
        totalDelinquency: 9600.00, principalPastDue: 5200.00, interestPastDue: 3100.00,
        escrowShortage: 850.00, lateCharges: 450.00,
        occupancyStatus: 'Owner Occupied', propertyType: 'Single Family',
        fhaInsured: true, foreclosureStatus: 'Active',
        foreclosureSaleDate: '2025-04-15', bankruptcyStatus: 'None',
        propertyValue: 395000.00, ltvRatio: 81.01,
        shortAddress: '123 Maple St, Chicago, IL',
        activeLMApplication: {
            applicationType: 'Loan Modification',
            submissionDate: '2024-12-01',
            currentStatus: 'Under Review',
            currentStage: 'Document Review',
            assignedSpecialist: 'Sarah Johnson',
            specialistExtension: '4567',
            expectedDecisionDate: '2025-01-15',
            pendingDocuments: ['Bank Statements'],
            receivedDocuments: ['Hardship Affidavit', 'Income Documentation']
        }
    },
    {
        id: 3, loanId: 'LN-2023-008901', loanAccountNumber: '7654321098',
        borrowerName: 'Jennifer Chen', coborrowerName: null,
        ssn: '***-**-9012', propertyAddress: '789 Pine Drive, Austin, TX 78701',
        unpaidPrincipal: 275000.00, monthlyPayment: 1950.00, escrowPayment: 380.00,
        interestRate: 6.50, daysPastDue: 60, monthsDelinquent: 2,
        totalDelinquency: 3900.00, principalPastDue: 2100.00, interestPastDue: 1300.00,
        escrowShortage: 350.00, lateCharges: 150.00,
        occupancyStatus: 'Owner Occupied', propertyType: 'Condominium',
        fhaInsured: true, foreclosureStatus: 'Active',
        foreclosureSaleDate: '2025-06-10', bankruptcyStatus: 'None',
        propertyValue: 310000.00, ltvRatio: 88.71,
        shortAddress: '789 Pine Dr, Austin, TX',
        activeLMApplication: null
    },
    {
        id: 4, loanId: 'LN-2024-005678', loanAccountNumber: '6543210987',
        borrowerName: 'David Thompson', coborrowerName: 'Lisa Thompson',
        ssn: '***-**-3456', propertyAddress: '321 Elm Boulevard, Denver, CO 80201',
        unpaidPrincipal: 410000.00, monthlyPayment: 3100.00, escrowPayment: 625.00,
        interestRate: 5.25, daysPastDue: 150, monthsDelinquent: 5,
        totalDelinquency: 15500.00, principalPastDue: 8500.00, interestPastDue: 5200.00,
        escrowShortage: 1300.00, lateCharges: 500.00,
        occupancyStatus: 'Owner Occupied', propertyType: 'Single Family',
        fhaInsured: true, foreclosureStatus: 'Active',
        foreclosureSaleDate: '2025-03-28', bankruptcyStatus: 'None',
        propertyValue: 485000.00, ltvRatio: 84.54,
        shortAddress: '321 Elm Blvd, Denver, CO',
        activeLMApplication: null
    },
    {
        id: 5, loanId: 'LN-2023-007123', loanAccountNumber: '5432109876',
        borrowerName: 'Amanda Williams', coborrowerName: null,
        ssn: '***-**-6789', propertyAddress: '567 Cedar Lane, Seattle, WA 98101',
        unpaidPrincipal: 390000.00, monthlyPayment: 2850.00, escrowPayment: 550.00,
        interestRate: 6.00, daysPastDue: 75, monthsDelinquent: 2,
        totalDelinquency: 5700.00, principalPastDue: 3200.00, interestPastDue: 1850.00,
        escrowShortage: 450.00, lateCharges: 200.00,
        occupancyStatus: 'Owner Occupied', propertyType: 'Townhouse',
        fhaInsured: true, foreclosureStatus: 'Active',
        foreclosureSaleDate: '2025-05-30', bankruptcyStatus: 'None',
        propertyValue: 465000.00, ltvRatio: 83.87,
        shortAddress: '567 Cedar Ln, Seattle, WA',
        activeLMApplication: {
            applicationType: 'Repayment Plan',
            submissionDate: '2024-12-15',
            currentStatus: 'Pending Approval',
            currentStage: 'Underwriting Review',
            assignedSpecialist: 'Michael Rodriguez',
            specialistExtension: '3892',
            expectedDecisionDate: '2025-01-05',
            pendingDocuments: [],
            receivedDocuments: ['All Required Documents']
        }
    }
];

// ─── Hardship Database ──────────────────────────────────────────────
const hardshipReasons = {
    temporary: [
        { reason: 'Auto Repairs', category: 'Temporary', hardshipType: 'Short-term', questions: [
            { seq: 1, question: 'Have repairs impacted your ability to work?' },
            { seq: 2, question: 'Are repairs completed?' },
            { seq: 3, question: 'When will the vehicle be usable?' },
            { seq: 4, question: 'Has income been affected?' }
        ]},
        { reason: 'Casualty Loss', category: 'Temporary', hardshipType: 'Short-term', questions: [
            { seq: 1, question: 'Has the property been damaged?' },
            { seq: 2, question: 'Was an insurance claim filed?' },
            { seq: 3, question: 'Is the home habitable?' },
            { seq: 4, question: 'When will repairs be completed?' }
        ]},
        { reason: 'Curtailment of Income', category: 'Temporary', hardshipType: 'Short-term', questions: [
            { seq: 1, question: 'What caused the reduction in income?' },
            { seq: 2, question: 'Is the reduction temporary?' },
            { seq: 3, question: 'When do you expect income to normalize?' },
            { seq: 4, question: 'Can you maintain payments until then?' }
        ]},
        { reason: 'Distant Employment Transfer', category: 'Temporary', hardshipType: 'Short-term', questions: [
            { seq: 1, question: 'Is the relocation temporary?' },
            { seq: 2, question: 'Has income changed due to transfer?' },
            { seq: 3, question: 'Do you plan to return?' },
            { seq: 4, question: 'What are your intentions for the property?' }
        ]},
        { reason: 'Excessive Obligations', category: 'Temporary', hardshipType: 'Short-term', questions: [
            { seq: 1, question: 'What additional expenses have increased?' },
            { seq: 2, question: 'Are these expenses temporary?' },
            { seq: 3, question: 'Have you adjusted your budget?' },
            { seq: 4, question: 'Can you continue mortgage payments?' }
        ]},
        { reason: 'Inability to Rent Property', category: 'Temporary', hardshipType: 'Short-term', questions: [
            { seq: 1, question: 'Is this a rental property?' },
            { seq: 2, question: 'Have you reduced the rent?' },
            { seq: 3, question: 'Is demand low in the area?' },
            { seq: 4, question: 'Have you considered selling?' }
        ]},
        { reason: 'Military Service', category: 'Temporary', hardshipType: 'Short-term', questions: [
            { seq: 1, question: 'Are you on active duty?' },
            { seq: 2, question: 'Can you pay during service?' },
            { seq: 3, question: 'Who manages finances while deployed?' },
            { seq: 4, question: 'Is a Power of Attorney in place?' }
        ]},
        { reason: 'Moved / Vacated', category: 'Temporary', hardshipType: 'Short-term', questions: [
            { seq: 1, question: 'Why did you move from the property?' },
            { seq: 2, question: 'Do you intend to return?' },
            { seq: 3, question: 'Is the property occupied?' },
            { seq: 4, question: 'Do you plan to sell or retain it?' }
        ]},
        { reason: 'Servicing / Payment Issue', category: 'Temporary', hardshipType: 'Short-term', questions: [
            { seq: 1, question: 'Was a payment made?' },
            { seq: 2, question: 'When and how was it submitted?' },
            { seq: 3, question: 'Do you have proof of payment?' },
            { seq: 4, question: 'Is the issue now resolved?' }
        ]},
        { reason: 'Unemployment', category: 'Temporary', hardshipType: 'Short-term', questions: [
            { seq: 1, question: 'When did unemployment begin?' },
            { seq: 2, question: 'Are you actively seeking work?' },
            { seq: 3, question: 'Are you receiving unemployment benefits?' },
            { seq: 4, question: 'Is there other income in the household?' }
        ]}
    ],
    permanent: [
        { reason: 'Abandonment of Property', category: 'Permanent', hardshipType: 'Long-term', questions: [
            { seq: 1, question: 'Why was the property abandoned?' },
            { seq: 2, question: 'Do you plan to return?' },
            { seq: 3, question: 'What is your plan for the property?' },
            { seq: 4, question: 'Have liquidation options been reviewed?' }
        ]},
        { reason: 'Bankruptcy', category: 'Permanent', hardshipType: 'Long-term', questions: [
            { seq: 1, question: 'Has bankruptcy been filed?' },
            { seq: 2, question: 'Which chapter was filed?' },
            { seq: 3, question: 'Is the mortgage included?' },
            { seq: 4, question: 'Are you working with an attorney?' }
        ]},
        { reason: 'Death of Mortgagor', category: 'Permanent', hardshipType: 'Long-term', questions: [
            { seq: 1, question: 'Can you maintain mortgage payments?' },
            { seq: 2, question: 'Do you intend to keep the property?' },
            { seq: 3, question: 'Have expenses increased due to the loss?' },
            { seq: 4, question: 'Have assumption or refinance options been reviewed?' }
        ]},
        { reason: 'Illness of Family Member', category: 'Permanent', hardshipType: 'Long-term', questions: [
            { seq: 1, question: 'Has caregiving reduced household income?' },
            { seq: 2, question: 'Is the condition long-term?' },
            { seq: 3, question: 'Have expenses increased?' },
            { seq: 4, question: 'Can you sustain the mortgage payment?' }
        ]},
        { reason: 'Illness of Mortgagor', category: 'Permanent', hardshipType: 'Long-term', questions: [
            { seq: 1, question: 'Has the illness caused permanent income loss?' },
            { seq: 2, question: 'Is the condition long-term?' },
            { seq: 3, question: 'Has your ability to work changed?' },
            { seq: 4, question: 'Can you continue making payments?' }
        ]},
        { reason: 'Inability to Sell Property', category: 'Permanent', hardshipType: 'Long-term', questions: [
            { seq: 1, question: 'How long has the property been listed?' },
            { seq: 2, question: 'Have you lowered the asking price?' },
            { seq: 3, question: 'Have offers been received?' },
            { seq: 4, question: 'Have alternatives been discussed?' }
        ]},
        { reason: 'Marital Difficulties', category: 'Permanent', hardshipType: 'Long-term', questions: [
            { seq: 1, question: 'Has the separation/divorce been finalized?' },
            { seq: 2, question: 'Who is responsible for the mortgage?' },
            { seq: 3, question: 'Will the property be retained or sold?' },
            { seq: 4, question: 'Has assumption or refinance been discussed?' }
        ]},
        { reason: 'Mortgage Fraud', category: 'Permanent', hardshipType: 'Long-term', questions: [
            { seq: 1, question: 'Was fraud identified at origination?' },
            { seq: 2, question: 'Have authorities been notified?' },
            { seq: 3, question: 'Is documentation available?' },
            { seq: 4, question: 'When is resolution expected?' }
        ]},
        { reason: 'Natural Disaster', category: 'Permanent', hardshipType: 'Long-term', questions: [
            { seq: 1, question: 'Was the property impacted by a disaster?' },
            { seq: 2, question: 'Has the area been declared a disaster zone?' },
            { seq: 3, question: 'Have relief or insurance claims been filed?' },
            { seq: 4, question: 'Is the property currently habitable?' }
        ]}
    ]
};

// ─── Workflow Steps ─────────────────────────────────────────────────
const icons = {
    1: '&#128269;', 2: '&#128203;', 3: '&#10003;', 4: '&#127968;',
    5: '&#128176;', 6: '&#128179;', 7: '&#127919;', 8: '&#128269;',
    9: '&#128181;', 10: '&#128221;', 11: '&#128197;', 12: '&#9201;',
    13: '&#9199;', 14: '&#128178;', 15: '&#128279;', 16: '&#128202;',
    17: '&#128228;', 18: '&#8505;', 19: '&#127960;', 20: '&#9989;',
    21: '&#9199;', 22: '&#128203;', 23: '&#128228;', 24: '&#128202;',
    25: '&#9989;'
};

function makeStep(id, name, type, showSearch, autoAdvance, endState, decisions, apiEndpoint, checklist, extra) {
    const step = {
        id, name, type, icon: icons[id] || '&#9679;',
        showSearchInterface: showSearch, autoAdvance, endState,
        decisions: decisions || null, apiEndpoint, checklist,
        script: null, showHardshipCapture: false, endStateType: null
    };
    if (extra) Object.assign(step, extra);
    return step;
}

const workflowSteps = [
    makeStep(1, 'Fetch Loan Details', 'fetch', true, false, false, null, 'POST /api/v1/loans/search',
        ['Provide agent name and company name', 'Deliver call recording disclosure', 'State Mini-Miranda / FDCPA disclosure',
         'Collect search criteria', 'Search loan database', 'Verify correct loan selected',
         'Confirm speaking with authorized borrower', 'Verify borrower identity', 'State account status',
         'Explain purpose of call', 'Confirm borrower occupancy status']),
    makeStep(2, 'Check Active LM', 'decision', false, false, false,
        [{ label: 'ACTIVE APPLICATION FOUND', next: 18 }, { label: 'NO ACTIVE APPLICATION', next: 3 }],
        'GET /api/v1/lossmitig/applications/{loanId}',
        ['Run automated system check for active applications', 'Review application status',
         'IF ACTIVE: Note application type and submission date', 'IF NO ACTIVE: Confirm ready to start new evaluation']),
    makeStep(3, 'Eligibility Factors', 'validation', false, true, false, null, 'POST /api/v1/eligibility/evaluate',
        ['Ask if property is primary residence', 'Verify property type', 'Run automated eligibility checks', 'Review validation results with borrower']),
    makeStep(4, 'Retention Eligibility', 'validation', false, true, false, null, 'POST /api/v1/retention/check-eligibility',
        ['Verify owner occupancy', 'Check foreclosure timeline', 'Check LTV ratio', 'Verify no prior FHA claim']),
    makeStep(5, 'Reinstatement Option', 'decision', false, false, false,
        [{ label: 'YES - Can Reinstate', next: 6 }, { label: 'NO - Cannot Reinstate', next: 7 }],
        'GET /api/v1/reinstatement/calculate',
        ['Calculate total reinstatement amount', 'Break down all components', 'Present payment deadline', 'Ask if borrower can pay full amount']),
    makeStep(6, 'Process Payment', 'action', false, false, true, null, 'POST /api/v1/payments/process',
        ['Verify reinstatement amount', 'Present payment method options', 'Provide wire transfer instructions', 'Process payment', 'Generate confirmation number'],
        { endStateType: 'payment-collection' }),
    makeStep(7, 'Retention Intent', 'decision', false, false, false,
        [{ label: 'YES - Keep Property', next: 8 }, { label: 'NO - Liquidate', next: 19 }],
        'POST /api/v1/borrower/capture-intent',
        ['Document borrower intent', 'Update case notes']),
    makeStep(8, 'Hardship Resolution Check', 'decision', false, false, false,
        [{ label: 'YES - Hardship Resolved', next: 9 }, { label: 'NO - Hardship Ongoing', next: 24 }],
        'POST /api/v1/hardship/check-resolution',
        ['Ask if hardship has been resolved', 'Document resolution status']),
    makeStep(24, 'Reason for Default', 'capture', false, false, false, null, 'POST /api/v1/hardship/capture-details',
        ['Select specific reason for default', 'System auto-determines hardship type', 'Ask and document all 4 customized questions', 'System auto-routes based on hardship type'],
        { showHardshipCapture: true }),
    makeStep(9, 'Surplus Income', 'decision', false, false, false,
        [{ label: 'YES - Can Pay More', next: 11 }, { label: 'NO - Cannot Pay More', next: 10 }],
        null, ['Verify income improvement', 'Assess surplus capacity']),
    makeStep(10, 'Collect Income', 'info', false, true, false, null, 'POST /api/v1/income/capture',
        ['Capture employment details', 'Document monthly income', 'Request income verification']),
    makeStep(11, 'Repayment Plan Eligibility', 'validation', false, false, false,
        [{ label: 'ELIGIBLE - Present RPP Terms', next: 20, recommended: true }, { label: 'NOT ELIGIBLE - Alternative Options', next: 12, recommended: false }],
        'POST /api/v1/repaymentplan/check-eligibility',
        ['Verify no permanent retention in past 24 months', 'Verify no failed TPP', 'Confirm property condition', 'Verify first-lien status']),
    makeStep(12, 'Hardship Duration', 'decision', false, false, false,
        [{ label: 'SHORT-TERM', next: 13 }, { label: 'LONG-TERM', next: 14 }],
        null, ['Classify hardship duration', 'Document expectations']),
    makeStep(13, 'Forbearance Eligibility', 'validation', false, false, false,
        [{ label: 'ELIGIBLE - Present Forbearance Options', next: 21, recommended: true }, { label: 'NOT ELIGIBLE - Alternative Options', next: 14, recommended: false }],
        'POST /api/v1/forbearance/check-eligibility',
        ['Verify first lien status', 'Confirm hardship not resolved', 'Check no recent LM workout', 'Verify no failed TPP']),
    makeStep(14, 'Payment Affordability', 'decision', false, false, false,
        [{ label: 'YES - Can Afford', next: 15 }, { label: 'NO - Need Reduction', next: 25 }],
        null, ['Assess current payment capacity', 'Calculate DTI ratio']),
    makeStep(25, 'Modification Eligibility', 'validation', false, false, false,
        [{ label: 'ELIGIBLE - Continue to Modification', next: 16, recommended: true }, { label: 'NOT ELIGIBLE - Route to Liquidation', next: 19, recommended: false }],
        'POST /api/v1/modification/validate-eligibility',
        ['Verify property is owner-occupied', 'Check payment history', 'Confirm sufficient income', 'Verify property condition']),
    makeStep(15, 'Partial Claim', 'decision', false, false, false,
        [{ label: 'ACCEPT Partial Claim', next: 22 }, { label: 'DECLINE', next: 16 }],
        'POST /api/v1/partialclaim/check-eligibility',
        ['Calculate PC amount', 'Verify < 30% UPB', 'Check DTI after PC']),
    makeStep(16, 'Modification Estimates', 'info', false, true, false, null, 'POST /api/v1/modification/check-eligibility',
        ['Display FHA modification waterfall programs', 'Calculate estimated payments', 'Explain waterfall order', 'Explain Trial Payment Plan requirement']),
    makeStep(17, 'Submit to Mod Team', 'action', false, false, true, null, 'POST /api/v1/modification/submit-application',
        ['Generate confirmation number', 'Assign to specialist queue', 'Send acknowledgment'],
        { endStateType: 'pending' }),
    makeStep(18, 'Display LM Status', 'info', false, false, true, null, 'GET /api/v1/lossmitig/applications/{id}/details',
        ['Retrieve current application status', 'Check for pending documents', 'Provide expected decision date', 'Answer borrower questions'],
        { endStateType: 'info' }),
    makeStep(19, 'Liquidation Options', 'action', false, false, true, null, 'POST /api/v1/liquidation/evaluate-options',
        ['Explain FHA liquidation waterfall', 'Detail Short Sale option', 'Detail Deed-in-Lieu option', 'Explain application requirement', 'Document borrower\'s selected option'],
        { endStateType: 'liquidation' }),
    makeStep(20, 'Repayment Plan Acceptance', 'decision', false, false, false,
        [{ label: 'YES - Accept RPP', next: 22, recommended: true }, { label: 'NO - Can\'t Afford', next: 12, recommended: false }],
        'POST /api/v1/repaymentplan/present-terms',
        ['Review complete RPP terms with borrower', 'Confirm borrower understands total payment', 'Verify borrower can afford plan']),
    makeStep(21, 'Forbearance Setup', 'action', false, false, true, null, 'POST /api/v1/forbearance/create',
        ['Calculate forbearance period', 'Review terms with borrower', 'Send forbearance agreement', 'Schedule review date', 'Suspend foreclosure'],
        { endStateType: 'success' }),
    makeStep(22, 'Repayment Plan Setup', 'action', false, false, true, null, 'POST /api/v1/repaymentplan/create',
        ['Confirm borrower acceptance', 'Generate repayment plan agreement', 'Set up auto-pay if requested', 'Calculate first payment date', 'Suspend foreclosure'],
        { endStateType: 'success' }),
    makeStep(23, 'Modification Submission', 'action', false, false, true, null, 'POST /api/v1/modification/submit-application',
        ['Verify all required documents', 'Submit application to underwriting', 'Generate confirmation number', 'Assign modification specialist', 'Suspend foreclosure'],
        { endStateType: 'pending' })
];

// ─── Fuzzy Search ───────────────────────────────────────────────────
function fuzzySearch(term) {
    if (!term || term.trim().length < 2) return [];
    const t = term.toLowerCase().trim();
    const results = [];

    for (const loan of loans) {
        let score = 0, matchType = '';

        if (loan.loanAccountNumber.toLowerCase() === t) { score = 100; matchType = 'Exact Match - Loan Number'; }
        else if (loan.loanId.toLowerCase() === t) { score = 100; matchType = 'Exact Match - Loan ID'; }
        else if (loan.borrowerName.toLowerCase() === t) { score = 100; matchType = 'Exact Match - Borrower Name'; }
        else if (loan.propertyAddress.toLowerCase() === t) { score = 100; matchType = 'Exact Match - Property Address'; }
        else if (loan.loanAccountNumber.toLowerCase().includes(t)) { score = 80; matchType = 'Partial Match - Loan Number'; }
        else if (loan.loanId.toLowerCase().includes(t)) { score = 80; matchType = 'Partial Match - Loan ID'; }
        else if (loan.borrowerName.toLowerCase().includes(t)) { score = 75; matchType = 'Partial Match - Borrower Name'; }
        else if (loan.propertyAddress.toLowerCase().includes(t)) { score = 75; matchType = 'Partial Match - Property Address'; }
        else {
            const searchWords = t.split(/\s+/);
            const nameWords = loan.borrowerName.toLowerCase().split(/\s+/);
            for (const sw of searchWords) {
                for (const nw of nameWords) {
                    if (nw.startsWith(sw) || sw.startsWith(nw)) { score = Math.max(score, 50); matchType = 'Fuzzy Match - Borrower Name'; }
                }
            }
            const addressParts = loan.propertyAddress.toLowerCase().split(/[\s,]+/);
            for (const sw of searchWords) {
                for (const ap of addressParts) {
                    if (ap.startsWith(sw) || sw.startsWith(ap)) { score = Math.max(score, 50); matchType = 'Fuzzy Match - Property Address'; }
                }
            }
        }

        if (score > 0) {
            const scoreColor = score === 100 ? '#4caf50' : score >= 75 ? '#2196f3' : '#ff9800';
            results.push({ loan, score, matchType, scoreColor });
        }
    }

    results.sort((a, b) => b.score - a.score);
    return results;
}

// ─── API Routes ─────────────────────────────────────────────────────

// Workflow steps
app.get('/api/v1/workflow/steps', (req, res) => res.json(workflowSteps));
app.get('/api/v1/workflow/steps/:stepId', (req, res) => {
    const step = workflowSteps.find(s => s.id === parseInt(req.params.stepId));
    step ? res.json(step) : res.status(404).json({ error: 'Step not found' });
});

// Loan search
app.get('/api/v1/loans/search', (req, res) => res.json(fuzzySearch(req.query.term)));

// Loan by ID
app.get('/api/v1/loans/:loanId', (req, res) => {
    const loan = loans.find(l => l.loanId === req.params.loanId);
    loan ? res.json(loan) : res.status(404).json({ error: 'Loan not found' });
});

// Reinstatement
app.get('/api/v1/loans/:loanId/reinstatement', (req, res) => {
    const loan = loans.find(l => l.loanId === req.params.loanId);
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    res.json({
        principalPastDue: loan.principalPastDue,
        interestPastDue: loan.interestPastDue,
        escrowShortage: loan.escrowShortage,
        lateCharges: loan.lateCharges,
        foreclosureCosts: 850.00,
        attorneyFees: 450.00,
        totalReinstatement: loan.principalPastDue + loan.interestPastDue + loan.escrowShortage + loan.lateCharges + 850 + 450
    });
});

// Repayment plan
app.get('/api/v1/loans/:loanId/repayment-plan', (req, res) => {
    const loan = loans.find(l => l.loanId === req.params.loanId);
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    const termMonths = 12;
    const additionalPayment = Math.round(loan.totalDelinquency / termMonths * 100) / 100;
    res.json({
        eligible: true, termMonths,
        regularPayment: loan.monthlyPayment,
        additionalPayment,
        totalPayment: loan.monthlyPayment + additionalPayment,
        totalArrears: loan.totalDelinquency
    });
});

// Partial claim
app.get('/api/v1/loans/:loanId/partial-claim', (req, res) => {
    const loan = loans.find(l => l.loanId === req.params.loanId);
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    const maxPC = loan.unpaidPrincipal * 0.30;
    if (loan.monthsDelinquent < 4) {
        return res.json({ eligible: false, ineligibleReason: `Must be 4+ months delinquent (currently ${loan.monthsDelinquent} months)` });
    }
    if (loan.totalDelinquency > maxPC) {
        return res.json({ eligible: false, ineligibleReason: 'Arrears exceed 30% of UPB limit' });
    }
    res.json({
        eligible: true,
        amount: loan.totalDelinquency,
        percentOfUPB: Math.round(loan.totalDelinquency / loan.unpaidPrincipal * 10000) / 100
    });
});

// Modification estimates
app.get('/api/v1/loans/:loanId/modification-estimates', (req, res) => {
    const loan = loans.find(l => l.loanId === req.params.loanId);
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    const isDisaster = req.query.isDisaster === 'true';
    const prefix = isDisaster ? 'FHA Disaster' : 'FHA';
    const currentPayment = loan.monthlyPayment;
    const income = 4800;
    const targetPayment = Math.round(income * 0.31);
    const maxPC = Math.min(loan.unpaidPrincipal * 0.30, loan.totalDelinquency);

    res.json([{
        category: `${prefix} Modification Programs`,
        options: [
            { name: `${prefix} Standalone Loan Modification 30 Year`, description: 'Capitalize arrears, reduce rate to current market rate, extend to 30 years',
              rate: 6.00, term: 360, termDisplay: '30 years', payment: 1850, savings: currentPayment - 1850, partialClaim: false, partialClaimAmount: null, paymentSupplement: false, supplementAmount: null },
            { name: `${prefix} Standalone Loan Modification 40 Year`, description: 'Capitalize arrears, reduce rate to current market rate, extend to 40 years',
              rate: 6.00, term: 480, termDisplay: '40 years', payment: 1620, savings: currentPayment - 1620, partialClaim: false, partialClaimAmount: null, paymentSupplement: false, supplementAmount: null },
            { name: `${prefix} Loan Modification and Partial Claim 30 Year`, description: 'Partial claim on arrears (up to 30% UPB), modify to 30 years',
              rate: 6.00, term: 360, termDisplay: '30 years', payment: 1750, savings: currentPayment - 1750, partialClaim: true, partialClaimAmount: maxPC, paymentSupplement: false, supplementAmount: null },
            { name: `${prefix} Loan Modification and Partial Claim 40 Year`, description: 'Partial claim on arrears (up to 30% UPB), modify to 40 years',
              rate: 6.00, term: 480, termDisplay: '40 years', payment: 1520, savings: currentPayment - 1520, partialClaim: true, partialClaimAmount: maxPC, paymentSupplement: false, supplementAmount: null },
            { name: `${prefix} Payment Supplement`, description: 'HUD provides monthly payment assistance to achieve affordability',
              rate: loan.interestRate, term: 0, termDisplay: 'Remaining', payment: targetPayment, savings: currentPayment - targetPayment, partialClaim: false, partialClaimAmount: null, paymentSupplement: true, supplementAmount: currentPayment - targetPayment }
        ]
    }]);
});

// Eligibility endpoints
app.get('/api/v1/loans/:loanId/eligibility/basic', (req, res) => {
    const loan = loans.find(l => l.loanId === req.params.loanId);
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    res.json({
        eligible: true, summary: 'ELIGIBLE FOR RETENTION OPTIONS', message: 'All general retention eligibility criteria met.',
        categories: [{ name: 'General Retention Requirements', checks: [
            { name: 'Owner Occupied', status: 'pass', details: "Property is borrower's primary residence", requirement: 'Must be owner-occupied' },
            { name: 'Days Past Due', status: 'pass', details: `${loan.daysPastDue} days (>=1 required)`, requirement: 'At least 1 day past due' },
            { name: 'Foreclosure Timeline', status: 'pass', details: '103 days in foreclosure (>=37 required)', requirement: 'Foreclosure initiated at least 37 days ago' },
            { name: 'LTV Ratio', status: 'pass', details: `${loan.ltvRatio}% (<=200% required)`, requirement: 'LTV must be <=200%' },
            { name: 'No Prior FHA Claim', status: 'pass', details: 'No previous FHA insurance claim on this loan', requirement: 'No prior FHA claim filed' }
        ]}]
    });
});

app.get('/api/v1/loans/:loanId/eligibility/repayment', (req, res) => {
    res.json({
        eligible: true, summary: 'ELIGIBLE FOR FHA REPAYMENT PLAN', message: 'All FHA Repayment Plan eligibility criteria met.',
        categories: [{ name: 'FHA Repayment Plan Eligibility', checks: [
            { name: 'No Disqualifying Prior Retention', status: 'pass', details: 'No permanent home retention in past 24 months | Status: PASS', requirement: 'Must NOT have received permanent retention in past 24 months' },
            { name: 'No Failed Trial Payment Plan', status: 'pass', details: 'No failed TPP during current default episode | Status: PASS', requirement: 'Must NOT have failed a TPP during current default episode' },
            { name: 'Property Condition Acceptable', status: 'pass', details: 'No adverse conditions | Status: PASS', requirement: 'Property must have NO adverse physical conditions' },
            { name: 'First-Lien Status Verified', status: 'pass', details: 'First lien position: Confirmed | Status: PASS', requirement: 'Servicer must ensure first-lien status compliance' }
        ]}]
    });
});

app.get('/api/v1/loans/:loanId/eligibility/forbearance', (req, res) => {
    res.json({
        eligible: true, summary: 'ELIGIBLE FOR FHA FORBEARANCE', message: 'All forbearance eligibility criteria met.',
        categories: [{ name: 'FHA Forbearance Eligibility', checks: [
            { name: 'First Lien Status', status: 'pass', details: 'Loan position: First lien | Status: PASS', requirement: 'Loan must be in first lien position' },
            { name: 'Hardship Not Resolved', status: 'pass', details: 'Hardship status: Ongoing/Not resolved | Status: PASS', requirement: 'Hardship must not be resolved' },
            { name: 'No Recent LM Workout', status: 'pass', details: 'Last workout: None in past 24 months | Status: PASS', requirement: 'No LM workout within past 24 months' },
            { name: 'Trial Payment Plan Status', status: 'pass', details: 'TPP history: No failed TPP in current default | Status: PASS', requirement: 'No failed TPP during current default' }
        ]}]
    });
});

app.get('/api/v1/loans/:loanId/eligibility/modification', (req, res) => {
    res.json({
        eligible: true, summary: 'ELIGIBLE FOR FHA MODIFICATION', message: 'All modification eligibility criteria met.',
        categories: [{ name: 'FHA Modification Eligibility', checks: [
            { name: 'Owner Occupancy', status: 'pass', details: "Property is borrower's primary residence | Status: PASS", requirement: 'Property must be owner-occupied' },
            { name: 'Income Qualification', status: 'pass', details: 'Sufficient income documented | Can achieve 31% DTI target | Status: PASS', requirement: 'Target DTI ratio of 31%' },
            { name: 'Property Condition', status: 'pass', details: 'Property in acceptable condition | Status: PASS', requirement: 'No adverse physical conditions' },
            { name: 'Prior Modification History', status: 'pass', details: 'No active modifications in past 24 months | Status: PASS', requirement: 'No active modifications in past 24 months' }
        ]}]
    });
});

// Hardship endpoints
app.get('/api/v1/hardship/reasons', (req, res) => res.json(hardshipReasons));

app.get('/api/v1/hardship/reason', (req, res) => {
    const { reason, category } = req.query;
    const list = category === 'Temporary' ? hardshipReasons.temporary : hardshipReasons.permanent;
    const found = list.find(r => r.reason === reason);
    found ? res.json(found) : res.status(404).json({ error: 'Reason not found' });
});

app.get('/api/v1/hardship/next-step', (req, res) => {
    const category = req.query.category;
    res.json({
        nextStep: category === 'Permanent' ? 15 : 13,
        hardshipType: category === 'Temporary' ? 'Short-term' : 'Long-term'
    });
});

// ─── Serve index.html ───────────────────────────────────────────────
app.get('/', (req, res) => {
    const stepsJson = JSON.stringify(workflowSteps).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Loss Mitigation Collections Workflow - Outamation</title>
    <link rel="stylesheet" href="/css/workflow.css"/>
</head>
<body>
    <div class="sidebar" id="sidebar">
        <div class="sidebar-header">
            <span class="sidebar-logo">&#127968;</span>
            <span class="sidebar-header-text">Loss Mitigation Workflow</span>
        </div>
        <div class="workflow-steps" id="workflowSteps"></div>
        <div class="sidebar-toggle" id="sidebarToggle" onclick="toggleSidebar()">
            <span class="toggle-icon">&#9664;</span>
            <span class="toggle-text">Collapse Menu</span>
        </div>
    </div>
    <div class="main-content" id="mainContent">
        <div class="loan-details-header" id="loanDetailsHeader">
            <div class="loan-info-grid" id="loanInfoGrid"></div>
        </div>
        <div class="tabs-container">
            <div class="tabs">
                <div class="tab active" onclick="switchTab('workflow')"><span>&#128260;</span> Workflow</div>
                <div class="tab" onclick="switchTab('script')"><span>&#128221;</span> Agent Prompt</div>
                <div class="tab" onclick="switchTab('checklist')"><span>&#10003;</span> Checklist</div>
                <div class="tab" onclick="switchTab('documents')"><span>&#128196;</span> Documents</div>
            </div>
        </div>
        <div class="tab-content-wrapper">
            <div id="workflow-panel" class="tab-panel active"><div id="workflowContent"></div></div>
            <div id="script-panel" class="tab-panel">
                <div class="script-section">
                    <div class="script-title">&#128222; Collections Agent Prompt</div>
                    <div class="script-content" id="scriptContent">Select a step to view the agent prompt.</div>
                </div>
            </div>
            <div id="checklist-panel" class="tab-panel">
                <h2 style="margin-bottom: 25px; color: var(--primary-blue);">&#128203; Agent Checklist</h2>
                <div id="checklistContent"></div>
            </div>
            <div id="documents-panel" class="tab-panel">
                <h2 style="margin-bottom: 25px; color: var(--primary-blue);">&#128196; Required Documents</h2>
                <div id="documentsContent">
                    <p style="color: #666; text-align: center; padding: 40px;">Select a step to view required documents.</p>
                </div>
            </div>
        </div>
    </div>
    <script>var WORKFLOW_STEPS_JSON = '${stepsJson}';</script>
    <script src="/js/workflow.js"></script>
</body>
</html>`;
    res.send(html);
});

// ─── Start Server ───────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  Loss Mitigation Workflow Server running at:`);
    console.log(`  -> http://localhost:${PORT}\n`);
    console.log(`  5 sample loans loaded. Try searching for "Sarah", "9876543210", or "Springfield"\n`);
});
