export const translations = {
    en: {
        appTitle: "Smart Bank Reconciliation",
        nav: {
            reconcile: "Reconciliation",
            report: "Last Report", // New
            history: "History / Archive"
        },
        welcome: {
            title: "Master Your Financial Reconciliation",
            subtitle: "Smart, Fast, and Accurate. Experience the new standard for automated bank reconciliation.",
            getStarted: "Get Started Now",
            features: {
                smart: { title: "Smart Matching", desc: "AI-driven algorithms to detect exact and complex matches." },
                auto: { title: "Auto-Detection", desc: "Automatically maps columns and detects data formats." },
                secure: { title: "Secure Archive", desc: "Keep a local history of all your reconciled transactions." },
                bilingual: { title: "Bilingual", desc: "Full support for English and Arabic interfaces." }
            }
        },
        upload: {
            title: "Smart Reconciliation",
            subtitle: "Upload your Bank Statement and Book Record to start matching.",
            modeLabel: "Reconciliation Type:",
            modes: {
                bank: "Bank Reconciliation",
                party: "Vendor / Customer Account"
            },
            clearHistory: "Clear History",
            dragDrop: "Drag & drop or click to upload",
            changeFile: "Change File",
            selectFile: "Select File",
            file1: {
                bank: "Bank Statement",
                party: "External Statement (Vendor/Customer)"
            },
            file2: {
                bank: "Book Record",
                party: "Internal Ledger (Our Record)"
            },
            settings: "Matching Settings",
            tolerance: "Tolerance (Days):",
            toleranceDesc: "Match within ±X days.",
            refMatch: "Require Reference / Check Number Match",
            reading: "Reading Files...",
            next: "Next: Map Columns",
            errorFile: "Please upload both files to proceed.",
            processing: "Processing & Checking Duplicates..."
        },
        mapper: {
            title: "Map Columns",
            subtitle: "Identify the columns for",
            file1: {
                bank: "Bank Statement",
                party: "External Statement"
            },
            file2: {
                bank: "Book Record",
                party: "Internal Ledger"
            },
            date: "Date Column",
            ref: "Reference / Check No.",
            desc: "Description / Narration",
            amounts: "Amounts (Select one or both)",
            col1: {
                bank: "Deposit / Credit / In",
                party: "Credit (Invoice / Add)"
            },
            col2: {
                bank: "Withdrawal / Debit / Out",
                party: "Debit (Payment / Deduct)"
            },
            preview: "File Preview (Top 3 Rows)",
            select: "-- Select Column --",
            next: "Next Step",
            validation_error: "Please map at least the Date and one Amount column.",
            amount_note: "* Please ensure you select the correct logic for In/Out amounts."
        },
        import: {
            title: "Import Analysis",
            total: "Total Rows:",
            new: "New (To Import)",
            duplicates: "Duplicates (Skipped)",
            confirm: "Confirm & Start Matching"
        },
        results: {
            newMatch: "Reconciliation Results",
            matched: "Total Matched",
            unmatchAll: "Unmatch All",
            approveAll: "Approve All",
            export: "Export Report",
            tabs: {
                confirmed: "Perfect Matches",
                possible: "Best Guesses (Check Dates)",
                amountOnly: "Amount Only Matches",
                manual: "Manual Match"
            },
            table: {
                status: "Status",
                date: "Date",
                ref: "Ref",
                desc: "Desc",
                amount: "Amount",
                matchDetails: "Match Logic",
                action: "Action"
            },
            badges: {
                confirmed: "Perfect",
                possible: "Strong Match",
                amountOnly: "Check Date",
                unmatched: "Unmatched",
                wrongSide: "Wrong Side",
                group: "Group Match",
                manual: "Manual"
            },
            manual: {
                tab: "Manual Match",
                title: "Manual Matching Table",
                bankSide: "Unmatched Bank Items",
                bookSide: "Unmatched Book Items",
                search: "Search (Amount / Ref)...",
                selected: "Selected",
                total: "Total",
                diff: "Diff",
                matchBtn: "Link & Match",
                clear: "Clear Selection",
                shortcuts: "💡 Tips: Use <kbd>Enter</kbd> to match selected, <kbd>Esc</kbd> to clear."
            }
        },
        history: {
            title: "Data Archive",
            subtitle: "View all historical data saved in the system.",
            noRecords: "No records found.",
            bankTab: "Bank Archive",
            bookTab: "Book Archive",
            runMatching: "Run Matching",
            clear: "Clear All Data"
        }
    },
    ar: {
        appTitle: "نظام المطابقة الذكي",
        nav: {
            reconcile: "المطابقة",
            report: "آخر تقرير",
            history: "الأرشيف / السجل"
        },
        welcome: {
            title: "أتقن مطابقة حساباتك المالية",
            subtitle: "ذكي، سريع، ودقيق. اكتشف المعيار الجديد للمطابقة البنكية الآلية.",
            getStarted: "ابدأ الآن",
            features: {
                smart: { title: "مطابقة ذكية", desc: "خوارزميات متقدمة لكشف التطابق التام والمعقد." },
                auto: { title: "كشف تلقائي", desc: "تعرف تلقائي على الأعمدة وتنسيقات البيانات." },
                secure: { title: "أرشيف آمن", desc: "احتفظ بسجل محلي كامل لجميع عمليات المطابقة." },
                bilingual: { title: "ثنائي اللغة", desc: "واجهة عربية وإنجليزية متكاملة." }
            }
        },
        upload: {
            title: "المطابقة الذكية",
            subtitle: "قم برفع كشف البنك وسجل الدفاتر (Excel/CSV) لبدء المطابقة.",
            modeLabel: "نوع المطابقة:",
            modes: {
                bank: "مطابقة بنكية",
                party: "مطابقة حساب (مورد / عميل)"
            },
            clearHistory: "مسح السجل",
            dragDrop: "اسحب الملف هنا أو انقر للرفع",
            changeFile: "تغيير الملف",
            selectFile: "اختر الملف",
            file1: {
                bank: "كشف البنك",
                party: "كشف الحساب (الخارجي)"
            },
            file2: {
                bank: "سجل الدفاتر",
                party: "حساب الأستاذ (الداخلي)"
            },
            settings: "إعدادات المطابقة",
            tolerance: "المهلة (أيام):",
            toleranceDesc: "المطابقة ضمن ±X أيام.",
            refMatch: "اشتراط تطابق رقم المرجع / الشيك",
            reading: "جاري قراءة الملفات...",
            next: "التالي: تحديد الأعمدة",
            errorFile: "يرجى رفع الملفين للمتابعة.",
            processing: "جاري المعالجة والتحقق من التكرار..."
        },
        mapper: {
            title: "تحديد الأعمدة",
            subtitle: "حدد الأعمدة المناسبة للملف:",
            file1: {
                bank: "كشف البنك",
                party: "كشف الحساب الخارجي"
            },
            file2: {
                bank: "سجل الدفاتر",
                party: "الدفتر الداخلي"
            },
            date: "عمود التاريخ",
            ref: "المرجع / رقم الشيك",
            desc: "البيان / الوصف",
            amounts: "المبالغ (اختر واحداً أو كلاهما)",
            col1: {
                bank: "إيداع / دائن / وارد",
                party: "دائن (فاتورة / إضافة)"
            },
            col2: {
                bank: "سحب / مدين / منصرف",
                party: "مدين (سداد / خصم)"
            },
            preview: "معاينة الملف (أول 3 صفوف)",
            select: "-- اختر العمود --",
            next: "الخطوة التالية",
            validation_error: "يرجى تحديد عمود التاريخ وعمود واحد للمبلغ على الأقل.",
            amount_note: "* يرجى التأكد من اختيار الأعمدة الصحيحة للإيداع والسحب لضمان دقة الإشارات."
        },
        import: {
            title: "تحليل الاستيراد",
            total: "إجمالي الصفوف:",
            new: "جديد (للاستيراد)",
            duplicates: "مكرر (تم تخطيه)",
            confirm: "تأكيد وبدء المطابقة"
        },
        results: {
            newMatch: "نتائج المطابقة",
            matched: "تمت المطابقة",
            unmatchAll: "إلغاء المطابقة للكل",
            approveAll: "اعتماد الكل",
            export: "تصدير التقرير",
            tabs: {
                confirmed: "مؤكدة (تطابق تام)",
                possible: "تطابق قوي (تحتاج تأكيد)",
                amountOnly: "تطابق المبالغ (دقق التاريخ)",
                manual: "مطابقة يدوية"
            },
            table: {
                status: "الحالة",
                date: "التاريخ",
                ref: "المرجع",
                desc: "البيان",
                amount: "المبلغ",
                matchDetails: "سبب التطابق",
                action: "إجراء"
            },
            badges: {
                confirmed: "مؤكد",
                possible: "قوي",
                amountOnly: "تشابه قيم",
                unmatched: "غير مطابق",
                wrongSide: "خطأ بالجانب",
                group: "تجميعي",
                manual: "يدوي"
            },
            manual: {
                tab: "مطابقة يدوية",
                title: "طاولة المطابقة اليدوية",
                bankSide: "عمليات البنك غير المطابقة",
                bookSide: "عمليات الدفاتر غير المطابقة",
                search: "بحث (مبلغ / مرجع)...",
                selected: "المحدد",
                total: "الإجمالي",
                diff: "الفارق",
                matchBtn: "ربط ومطابقة",
                clear: "مسح التحديد",
                shortcuts: "💡 تلميح: استخدم <kbd>Enter</kbd> للمطابقة، و <kbd>Esc</kbd> لإلغاء التحديد."
            }
        },
        history: {
            title: "أرشيف البيانات",
            subtitle: "عرض جميع البيانات التاريخية المحفوظة في النظام.",
            noRecords: "لا توجد سجلات.",
            bankTab: "أرشيف البنك",
            bookTab: "أرشيف الدفاتر",
            runMatching: "تشغيل المطابقة",
            showing: "يتم عرض أول 200 سجل."
        },
        import: {
            title: "تحليل الاستيراد",
            new: "جديد (للاستيراد)",
            duplicates: "مكرر (تم تخطيه)",
            total: "إجمالي الصفوف",
            confirm: "تأكيد وبدء المطابقة"
        }
    }
};
