document.addEventListener('DOMContentLoaded', () => {
    // State management
    let analysesData = JSON.parse(localStorage.getItem('analysesData')) || {
        'cbc': {
            name: 'تحليل صورة دم كاملة (CBC)',
            params: [
                { name: 'Hemoglobin', unit: 'g/dL', normal: '12 - 16' },
                { name: 'WBCs', unit: '10^3/µL', normal: '4 - 11' },
                { name: 'RBCs', unit: '10^6/µL', normal: '4.2 - 5.4' },
                { name: 'Platelets', unit: '10^3/µL', normal: '150 - 450' }
            ]
        },
        'fbs': {
            name: 'سكر صائم (Fasting Blood Sugar)',
            params: [
                { name: 'Glucose Fasting', unit: 'mg/dL', normal: '70 - 100' }
            ]
        },
        'alt': {
            name: 'إنزيم الكبد (ALT / SGPT)',
            params: [
                { name: 'ALT', unit: 'U/L', normal: '7 - 56' }
            ]
        },
        'ast': {
            name: 'إنزيم الكبد (AST / SGOT)',
            params: [
                { name: 'AST', unit: 'U/L', normal: '8 - 48' }
            ]
        },
        'lipid_profile': {
            name: 'صورة دهون كاملة (Lipid Profile)',
            params: [
                { name: 'Total Cholesterol', unit: 'mg/dL', normal: '< 200' },
                { name: 'Triglycerides', unit: 'mg/dL', normal: '< 150' },
                { name: 'HDL', unit: 'mg/dL', normal: '> 40' },
                { name: 'LDL', unit: 'mg/dL', normal: '< 100' }
            ]
        },
        'tsh': {
            name: 'هرمون الغدة الدرقية (TSH)',
            params: [
                { name: 'TSH', unit: 'mIU/L', normal: '0.4 - 4.0' }
            ]
        },
        'creatinine': {
            name: 'وظائف كلى - كرياتينين (Creatinine)',
            params: [
                { name: 'Serum Creatinine', unit: 'mg/dL', normal: '0.6 - 1.2' }
            ]
        },
        'hbA1c': {
            name: 'السكر التراكمي (HbA1c)',
            params: [
                { name: 'HbA1c', unit: '%', normal: '4.0 - 5.6' }
            ]
        },
        'uric_acid': {
            name: 'النقرس - حمض اليوريك (Uric Acid)',
            params: [
                { name: 'Uric Acid', unit: 'mg/dL', normal: '3.5 - 7.2' }
            ]
        },
        'urea': {
            name: 'وظائف كلى - يوريا (Urea/BUN)',
            params: [
                { name: 'Blood Urea', unit: 'mg/dL', normal: '15 - 45' },
                { name: 'BUN', unit: 'mg/dL', normal: '7 - 20' }
            ]
        },
        'crp': {
            name: 'بروتين سي التفاعلي (CRP)',
            params: [
                { name: 'CRP', unit: 'mg/L', normal: '< 6.0' }
            ]
        },
        'esr': {
            name: 'سرعة ترسب الدم (ESR)',
            params: [
                { name: 'ESR (1st Hour)', unit: 'mm/hr', normal: '0 - 15' },
                { name: 'ESR (2nd Hour)', unit: 'mm/hr', normal: '0 - 20' }
            ]
        },
        'vit_d': {
            name: 'فيتامين د (Vitamin D)',
            params: [
                { name: '25-OH Vitamin D', unit: 'ng/mL', normal: '30 - 100' }
            ]
        }
    };

    let pendingAnalyses = JSON.parse(localStorage.getItem('pendingAnalyses')) || [];
    let completedAnalyses = JSON.parse(localStorage.getItem('completedAnalyses')) || [];

    // DOM Elements
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');
    const adminToggle = document.getElementById('admin-mode-toggle');
    const adminPanelBtn = document.querySelector('.admin-only');
    const pageTitle = document.getElementById('page-title');
    const pendingCount = document.getElementById('pending-count');

    // Forms
    const newAnalysisForm = document.getElementById('new-analysis-form');
    const analysisTypeSelect = document.getElementById('analysis-type');
    const dynamicFieldsContainer = document.getElementById('dynamic-analysis-fields');
    const pendingTableBody = document.getElementById('pending-table-body');
    const addAnalysisForm = document.getElementById('add-analysis-type-form');
    const systemAnalysesList = document.getElementById('system-analyses-list');
    const addParamBtn = document.getElementById('add-param-btn');
    const parametersList = document.getElementById('parameters-list');

    // Search Elems
    const globalSearch = document.getElementById('global-search');
    const searchType = document.getElementById('search-type');
    const searchDropdown = document.getElementById('search-dropdown');

    // Modal
    const patientModal = document.getElementById('patient-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');

    // Initialize
    updatePendingCount();
    populateAnalysisSelect();
    renderPendingTable();
    renderSystemAnalyses();

    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const btn = e.currentTarget;
            if (btn.classList.contains('hidden')) return;

            const viewId = btn.getAttribute('data-view');

            navItems.forEach(n => n.classList.remove('active'));
            btn.classList.add('active');

            views.forEach(v => v.classList.remove('active'));
            document.getElementById(`view-${viewId}`).classList.add('active');

            pageTitle.innerText = btn.querySelector('span').innerText;
        });
    });

    // Admin Toggle with Password
    adminToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            const pass = prompt('أدخل الرقم السري لفتح وضع الإدارة:');
            if (pass === '1357') {
                adminPanelBtn.classList.remove('hidden');
            } else {
                alert('الرقم السري خاطئ!');
                e.target.checked = false;
            }
        } else {
            adminPanelBtn.classList.add('hidden');
            if (adminPanelBtn.classList.contains('active')) {
                navItems[0].click(); // fallback route
            }
        }
    });

    // Populate Analysis Dropdown
    function populateAnalysisSelect() {
        analysisTypeSelect.innerHTML = '<option value="" disabled selected>اختر نوع التحليل</option>';
        for (let key in analysesData) {
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = analysesData[key].name;
            analysisTypeSelect.appendChild(opt);
        }
    }

    // Handle Analysis Selection for Dynamic Fields
    analysisTypeSelect.addEventListener('change', (e) => {
        const type = e.target.value;
        const analysis = analysesData[type];

        dynamicFieldsContainer.innerHTML = '';
        if (!analysis) return;

        analysis.params.forEach(param => {
            const div = document.createElement('div');
            div.className = 'input-group';
            div.innerHTML = `
                <label dir="ltr" style="text-align: right;">${param.name} (${param.unit}) <br><small style="color:var(--text-muted)">المعدل الطبيعي: ${param.normal}</small></label>
                <input type="text" class="analysis-result-input" data-name="${param.name}" data-unit="${param.unit}" data-normal="${param.normal}" required placeholder="أدخل النتيجة هنا" style="direction: ltr; text-align: left;">
            `;
            dynamicFieldsContainer.appendChild(div);
        });
    });

    // Save New Analysis to Pending List
    newAnalysisForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const typeKey = analysisTypeSelect.value;
        const resultInputs = document.querySelectorAll('.analysis-result-input');

        let results = [];
        resultInputs.forEach(input => {
            results.push({
                name: input.getAttribute('data-name'),
                unit: input.getAttribute('data-unit'),
                normal: input.getAttribute('data-normal'),
                value: input.value
            });
        });

        const entry = {
            id: Date.now().toString(),
            date: new Date().toLocaleDateString('ar-EG'),
            institution: document.getElementById('institution-name').value,
            patientName: document.getElementById('patient-name').value,
            patientAge: document.getElementById('patient-age').value,
            patientPhone: document.getElementById('patient-phone').value,
            analysisType: analysesData[typeKey].name,
            results: results
        };

        pendingAnalyses.push(entry);
        localStorage.setItem('pendingAnalyses', JSON.stringify(pendingAnalyses));

        updatePendingCount();
        renderPendingTable();

        // Reset and redirect
        e.target.reset();
        dynamicFieldsContainer.innerHTML = '';
        navItems[1].click(); // Go to pending tab
    });

    // Render Pending Table
    function renderPendingTable() {
        pendingTableBody.innerHTML = '';
        pendingAnalyses.forEach(entry => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${entry.date}</td>
                <td>${entry.patientName}</td>
                <td dir="ltr">${entry.patientPhone}</td>
                <td>${entry.analysisType}</td>
                <td>${entry.institution}</td>
                <td style="display:flex; gap:10px; justify-content:flex-end;">
                    <button class="btn btn-success btn-small" onclick="sendAnalysis('${entry.id}')" title="إرسال التقرير عبر واتساب وإخفاء التحليل">
                        <i class="fa-brands fa-whatsapp"></i> تأكيد وإرسال
                    </button>
                    <button class="btn btn-danger btn-small" onclick="deletePending('${entry.id}')" title="حذف التحليل">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            `;
            pendingTableBody.appendChild(tr);
        });
    }

    // Update Counter
    function updatePendingCount() {
        pendingCount.textContent = pendingAnalyses.length;
    }

    // Delete Pending Record
    window.deletePending = (id) => {
        if (confirm('هل أنت متأكد من حذف هذا التحليل المعلق؟')) {
            pendingAnalyses = pendingAnalyses.filter(a => a.id !== id);
            localStorage.setItem('pendingAnalyses', JSON.stringify(pendingAnalyses));
            renderPendingTable();
            updatePendingCount();
        }
    };

    // Helper to check risk
    function checkRisk(valueStr, normalStr) {
        const val = parseFloat(valueStr);
        if (isNaN(val)) return false;

        const norm = normalStr.replace(/\s+/g, '');
        if (norm.includes('-')) {
            const parts = norm.split('-');
            if (parts.length === 2) {
                const min = parseFloat(parts[0]);
                const max = parseFloat(parts[1]);
                if (!isNaN(min) && !isNaN(max)) {
                    return val < min || val > max;
                }
            }
        } else if (norm.startsWith('>')) {
            const min = parseFloat(norm.substring(1));
            if (!isNaN(min)) {
                return val <= min;
            }
        } else if (norm.startsWith('<')) {
            const max = parseFloat(norm.substring(1));
            if (!isNaN(max)) {
                return val >= max;
            }
        }
        return false;
    }

    // Auto Formatter for Phone
    function formatPhoneNumber(phone) {
        let formatted = phone.trim();
        formatted = formatted.replace(/[\s-]/g, '');
        if (formatted.startsWith('01')) {
            formatted = '+20' + formatted.substring(1);
        } else if (!formatted.startsWith('+')) {
            formatted = '+' + formatted;
        }
        return formatted;
    }

    // Generate PDF, Download, and Mark as Completed
    window.sendAnalysis = async (id) => {
        const entry = pendingAnalyses.find(a => a.id === id);
        if (!entry) return;

        // Populate Template
        const pdfContent = `
            <div style="padding: 40px; font-family: 'Tajawal', sans-serif; direction: rtl; background: white; color: black;">
                <div style="text-align: center; border-bottom: 3px solid #0b5e7d; padding-bottom: 20px; margin-bottom: 30px;">
                    <h1 style="color: #0b5e7d; font-size: 28px; margin: 0;">${entry.institution}</h1>
                    <p style="color: #7f8c8d; font-size: 16px; margin: 5px 0 0 0;">المختبر الطبي للتحاليل الشاملة</p>
                </div>
                
                <table style="width: 100%; margin-bottom: 30px; border-collapse: collapse; font-size: 16px;">
                    <tr>
                        <th style="padding: 10px; text-align: right; color: #2c3e50;">اسم المريض:</th>
                        <td style="padding: 10px;">${entry.patientName}</td>
                        <th style="padding: 10px; text-align: right; color: #2c3e50;">العمر:</th>
                        <td style="padding: 10px;">${entry.patientAge} سنة</td>
                    </tr>
                    <tr>
                        <th style="padding: 10px; text-align: right; color: #2c3e50;">التاريخ:</th>
                        <td style="padding: 10px;">${entry.date}</td>
                        <th style="padding: 10px; text-align: right; color: #2c3e50;">نوع التحليل:</th>
                        <td style="padding: 10px; font-weight: bold;">${entry.analysisType}</td>
                    </tr>
                </table>

                <h2 style="color: #0b5e7d; border-bottom: 1px solid #dcdde1; padding-bottom: 10px; margin-bottom: 20px;">نتيجة الفحص (Test Results)</h2>

                <table style="width: 100%; border-collapse: collapse; font-size: 15px; margin-bottom: 40px;">
                    <thead>
                        <tr style="background: #f4f7f6; color: #2c3e50;">
                            <th style="padding: 12px; border: 1px solid #dcdde1; text-align: left; direction: ltr;">Test</th>
                            <th style="padding: 12px; border: 1px solid #dcdde1; text-align: center;">Result</th>
                            <th style="padding: 12px; border: 1px solid #dcdde1; text-align: left; direction: ltr;">Unit</th>
                            <th style="padding: 12px; border: 1px solid #dcdde1; text-align: left; direction: ltr;">Reference Range</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${entry.results.map(res => `
                            <tr>
                                <td style="padding: 10px; border: 1px solid #dcdde1; text-align: left; direction: ltr; font-weight: 500;">${res.name}</td>
                                <td style="padding: 10px; border: 1px solid #dcdde1; text-align: center; font-weight: bold; color: #e74c3c;">${res.value}</td>
                                <td style="padding: 10px; border: 1px solid #dcdde1; text-align: left; direction: ltr; color: #7f8c8d;">${res.unit}</td>
                                <td style="padding: 10px; border: 1px solid #dcdde1; text-align: left; direction: ltr; color: #7f8c8d;">${res.normal}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div style="text-align: center; margin-top: 60px; font-size: 14px; color: #bdc3c7;">
                    <p>*** نهاية التقرير ***</p>
                    <p>تم الإصدار إلكترونياً ولا يحتاج لتوقيع</p>
                </div>
            </div>
        `;

        // Ensure PDF is temporarily "in-flow" to capture data properly
        const templateContainer = document.getElementById('pdf-template');
        templateContainer.innerHTML = pdfContent;
        templateContainer.classList.add('rendering');

        const opt = {
            margin: 10,
            filename: `SmartLab_${entry.patientName.replace(/\s+/g, '_')}_${entry.date.replace(/\//g, '-')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        const btnIdSelector = `button[onclick="sendAnalysis('${entry.id}')"]`;
        const actionBtn = document.querySelector(btnIdSelector);
        let originalHtml = actionBtn ? actionBtn.innerHTML : '';
        if (actionBtn) {
            actionBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري التحميل...';
            actionBtn.disabled = true;
        }

        // HTML2PDF Download
        html2pdf().set(opt).from(templateContainer).save().then(() => {
            const formattedPhone = formatPhoneNumber(entry.patientPhone);
            const waPhone = formattedPhone.replace('+', '');

            let reportMsg = `*تقرير النتائج:*\n`;
            let hasRisk = false;
            let riskAlerts = [];

            entry.results.forEach(res => {
                const isAbnormal = checkRisk(res.value, res.normal);
                if (isAbnormal) {
                    hasRisk = true;
                    riskAlerts.push(`⚠️ ${res.name}: ${res.value} ${res.unit} (طبيعي: ${res.normal})`);
                }
                reportMsg += `- ${res.name}: ${res.value} ${res.unit}\n`;
            });

            let msg = `مرحباً بك ${entry.patientName}، 🩺\n\n`;
            msg += `مرفق لسيادتكم من "${entry.institution}" نتيجة تحليل (${entry.analysisType}) الخاص بكم، بتاريخ: ${entry.date}.\n\n`;
            msg += `${reportMsg}\n`;

            if (hasRisk) {
                msg += `🚨 *تنبيه هام:* تم رصد نتائج خارج المعدل الطبيعي:\n`;
                msg += riskAlerts.join('\n') + `\n`;
                msg += `يُرجى مراجعة الطبيب المختص لتقييم الحالة وتوجيهكم بشكل سليم.\n\n`;
            } else {
                msg += `✅ جميع النتائج تقع ضمن المعدل الطبيعي ولله الحمد.\n\n`;
            }

            msg += `📌 *ملاحظة هامة:* يرجى إرفاق وإرسال ملف التقرير (PDF) الذي تم تحميله للتو على جهازك في هذه المحادثة لحفظه في سجلك.\n\n`;
            msg += `مع خالص تمنياتنا لكم بدوام الصحة والعافية. 🤍\n- SmartLab`;

            const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`;
            window.open(waUrl, '_blank');

            // Clean up UI wrapper
            templateContainer.classList.remove('rendering');

            // Add to completed, remove from pending
            completedAnalyses.push(entry);
            localStorage.setItem('completedAnalyses', JSON.stringify(completedAnalyses));

            pendingAnalyses = pendingAnalyses.filter(a => a.id !== id);
            localStorage.setItem('pendingAnalyses', JSON.stringify(pendingAnalyses));

            renderPendingTable();
            updatePendingCount();

        }).catch(err => {
            if (actionBtn) {
                actionBtn.innerHTML = originalHtml;
                actionBtn.disabled = false;
            }
            alert("حدث خطأ أثناء تحميل التقرير.");
            console.error(err);
        });
    };

    // Global Search Logic 
    globalSearch.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase().trim();
        const sType = searchType.value;

        if (!val) {
            searchDropdown.classList.add('hidden');
            return;
        }

        searchDropdown.innerHTML = '';
        searchDropdown.classList.remove('hidden');

        if (sType === 'analysis') {
            const matches = Object.entries(analysesData).filter(([k, v]) => v.name.toLowerCase().includes(val));
            if (matches.length === 0) {
                searchDropdown.innerHTML = '<div class="search-item">لا توجد نتائج لمطابقة التحليل</div>';
            } else {
                matches.forEach(([k, v]) => {
                    const div = document.createElement('div');
                    div.className = 'search-item';
                    div.innerHTML = `<i class="fa-solid fa-vial" style="margin-left:8px;"></i> ${v.name}`;
                    div.addEventListener('click', () => {
                        navItems[0].click(); // open new analysis
                        analysisTypeSelect.value = k;
                        analysisTypeSelect.dispatchEvent(new Event('change'));
                        searchDropdown.classList.add('hidden');
                        globalSearch.value = '';
                    });
                    searchDropdown.appendChild(div);
                });
            }
        } else if (sType === 'patient') {
            const allPatients = [...pendingAnalyses, ...completedAnalyses];
            const uniquePatientsMap = new Map();
            allPatients.forEach(p => {
                if (!uniquePatientsMap.has(p.patientName)) {
                    uniquePatientsMap.set(p.patientName, p);
                }
            });

            const matches = Array.from(uniquePatientsMap.values()).filter(p => p.patientName.toLowerCase().includes(val) || p.patientPhone.includes(val));

            if (matches.length === 0) {
                searchDropdown.innerHTML = '<div class="search-item">لا توجد نتائج لمطابقة المريض</div>';
            } else {
                matches.forEach(p => {
                    const div = document.createElement('div');
                    div.className = 'search-item';
                    div.innerHTML = `<i class="fa-solid fa-user" style="margin-left:8px;"></i> ${p.patientName} - <span dir="ltr">${p.patientPhone}</span>`;
                    div.addEventListener('click', () => {
                        showPatientModal(p.patientName);
                        searchDropdown.classList.add('hidden');
                        globalSearch.value = '';
                    });
                    searchDropdown.appendChild(div);
                });
            }
        }
    });

    // Hidden dropdown on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            searchDropdown.classList.add('hidden');
        }
    });

    // Patient Modal Functions
    function showPatientModal(patientName) {
        const allPatients = [...pendingAnalyses, ...completedAnalyses];
        const history = allPatients.filter(p => p.patientName === patientName);
        if (history.length === 0) return;

        // Use the most recent entry for demographic data
        const latest = history[history.length - 1];

        document.getElementById('modal-patient-name').textContent = latest.patientName;
        document.getElementById('modal-patient-info').innerHTML = `
            <p style="margin-bottom:8px;"><strong><i class="fa-solid fa-cake-candles" style="margin-left:5px;"></i> العمر:</strong> ${latest.patientAge} سنة</p>
            <p><strong><i class="fa-solid fa-phone" style="margin-left:5px;"></i> رقم التواصل:</strong> <span dir="ltr">${latest.patientPhone}</span></p>
        `;

        const historyList = document.getElementById('modal-patient-history');
        historyList.innerHTML = '';

        history.forEach(item => {
            const li = document.createElement('li');

            let tableRows = '';
            item.results.forEach(res => {
                tableRows += `
                    <tr>
                        <td style="padding:8px; border-bottom:1px solid var(--border-color); direction:ltr; text-align:left;">${res.name}</td>
                        <td style="padding:8px; border-bottom:1px solid var(--border-color); font-weight:bold; color:var(--accent-color);">${res.value}</td>
                        <td style="padding:8px; border-bottom:1px solid var(--border-color); direction:ltr; color:var(--text-muted);">${res.unit}</td>
                        <td style="padding:8px; border-bottom:1px solid var(--border-color); direction:ltr; color:var(--text-muted);">${res.normal}</td>
                    </tr>
                `;
            });

            li.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; cursor:pointer; padding: 5px;" onclick="this.nextElementSibling.classList.toggle('hidden')">
                    <div>
                        <strong style="color:var(--primary-color)">${item.analysisType}</strong>
                        <div style="font-size: 14px; color: var(--text-muted); margin-top:5px;"><i class="fa-regular fa-calendar"></i> ${item.date}</div>
                    </div>
                    <i class="fa-solid fa-chevron-down" style="color:var(--text-muted)"></i>
                </div>
                <div class="hidden" style="margin-top:15px; background:var(--background-color); padding:10px; border-radius:8px;">
                    <table style="width:100%; border-collapse:collapse; font-size:14px; text-align:center;">
                        <thead>
                            <tr style="background:var(--sidebar-active); color: var(--text-color);">
                                <th style="padding:8px; direction:ltr; text-align:left;">Test</th>
                                <th style="padding:8px;">Result</th>
                                <th style="padding:8px; direction:ltr; text-align:left;">Unit</th>
                                <th style="padding:8px; direction:ltr; text-align:left;">Reference Range</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
            `;
            historyList.appendChild(li);
        });

        patientModal.classList.remove('hidden');
    }

    closeModalBtn.addEventListener('click', () => {
        patientModal.classList.add('hidden');
    });

    // Add Dynamic Parameter Input in Admin Panel
    addParamBtn.addEventListener('click', () => {
        const div = document.createElement('div');
        div.className = 'parameter-item';
        div.innerHTML = `
            <input type="text" class="param-name" placeholder="اسم الخانة (مثل: ALT)" required>
            <input type="text" class="param-unit" placeholder="الوحدة (مثل: U/L)" required>
            <input type="text" class="param-normal" placeholder="المعدل الطبيعي (مثل: 7 - 56)" required>
            <button type="button" class="btn btn-danger btn-icon remove-param"><i class="fa-solid fa-trash"></i></button>
        `;
        parametersList.appendChild(div);
    });

    parametersList.addEventListener('click', (e) => {
        const btn = e.target.closest('.remove-param');
        if (btn) {
            btn.closest('.parameter-item').remove();
        }
    });

    // Save New Custom Analysis
    addAnalysisForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('new-analysis-name').value;
        const paramItems = document.querySelectorAll('.parameter-item');

        let params = [];
        paramItems.forEach(item => {
            params.push({
                name: item.querySelector('.param-name').value,
                unit: item.querySelector('.param-unit').value,
                normal: item.querySelector('.param-normal').value
            });
        });

        if (params.length === 0) {
            alert('يرجى إضافة خانة واحدة على الأقل قبل الحفظ.');
            return;
        }

        const key = 'analysis_' + Date.now();
        analysesData[key] = {
            name: name,
            params: params
        };

        localStorage.setItem('analysesData', JSON.stringify(analysesData));

        populateAnalysisSelect();
        renderSystemAnalyses();

        e.target.reset();
        parametersList.innerHTML = `
            <div class="parameter-item">
                <input type="text" class="param-name" placeholder="اسم الخانة (مثل: Hemoglobin)" required>
                <input type="text" class="param-unit" placeholder="الوحدة (مثل: g/dL)" required>
                <input type="text" class="param-normal" placeholder="المعدل الطبيعي (مثل: 12 - 16)" required>
                <button type="button" class="btn btn-danger btn-icon remove-param"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;

        alert('تم تسجيل التحليل الشامل في النظام بنجاح!');
    });

    // Render Configured Analyses
    function renderSystemAnalyses() {
        systemAnalysesList.innerHTML = '';
        for (let key in analysesData) {
            const li = document.createElement('li');
            li.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:5px;">
                    <strong style="color:var(--primary-color)">${analysesData[key].name}</strong>
                    <small style="color:var(--text-muted)">عدد المؤشرات المرتبطة: ${analysesData[key].params.length}</small>
                </div>
                ${key.startsWith('analysis_') ? `<button class="btn btn-danger btn-small" onclick="deleteAnalysisPattern('${key}')"><i class="fa-solid fa-trash"></i></button>` : `<span class="badge" style="background:#bdc3c7; color:white; padding: 4px 8px; border-radius: 4px;">افتراضي</span>`}
            `;
            systemAnalysesList.appendChild(li);
        }
    }

    // Delete Pattern Custom
    window.deleteAnalysisPattern = (key) => {
        if (confirm('هل تود حذف هذا التحليل نهائياً من القائمة؟')) {
            delete analysesData[key];
            localStorage.setItem('analysesData', JSON.stringify(analysesData));
            renderSystemAnalyses();
            populateAnalysisSelect();
        }
    };
});
