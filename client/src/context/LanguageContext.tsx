import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

export type Language = "eng" | "mm";

const rentalUiTranslations = {
  eng: {
    student: "Student", teacher: "Teacher", studentName: "Student name", teacherName: "Teacher name", rollNumber: "Roll number", phone: "Phone", phoneNumber: "Phone number", email: "Email", major: "Major", batch: "Batch", laptopStatus: "Laptop status", addStudent: "Add Student", editStudent: "Edit Student", updateStudent: "Update Student", addTeacher: "Add Teacher", editTeacher: "Edit Teacher", updateTeacher: "Update Teacher", importCsv: "Import CSV", searchStudents: "Search by student name, roll number, or major...", searchTeachers: "Search teacher, phone, email, or department...", noStudents: "No students found.", noTeachers: "No teachers found.", selectDepartment: "Select department", noRental: "No Rental", borrowerRole: "Borrower role", allMajors: "All majors", allBatches: "All batches", selected: "Selected", shown: "shown", selectAllEligible: "Select all eligible", qrLaptops: "QR laptops", issuedDate: "Issued date", expectedReturnDate: "Expected return date", confirmRental: "Confirm Rental", bulkIssueRental: "Bulk Issue Laptop Rental", assignLaptops: "Assign QR-tagged inventory laptops to students or teachers.", alreadyRented: "Already rented", loading: "Loading...", manageStudents: "Add, import, search, edit, and delete students for laptop rental.", manageTeachers: "Add teachers here; they will appear immediately when issuing a rental.", update: "Update",
  },
  mm: {
    student: "ကျောင်းသား", teacher: "ဆရာ/ဆရာမ", studentName: "ကျောင်းသားအမည်", teacherName: "ဆရာ/ဆရာမအမည်", rollNumber: "ခုံအမှတ်", phone: "ဖုန်း", phoneNumber: "ဖုန်းနံပါတ်", email: "အီးမေးလ်", major: "အထူးပြုဘာသာ", batch: "အတန်း", laptopStatus: "လက်ပ်တော့အခြေအနေ", addStudent: "ကျောင်းသားထည့်ရန်", editStudent: "ကျောင်းသားပြင်ရန်", updateStudent: "ကျောင်းသားပြင်ဆင်ရန်", addTeacher: "ဆရာ/ဆရာမထည့်ရန်", editTeacher: "ဆရာ/ဆရာမပြင်ရန်", updateTeacher: "ဆရာ/ဆရာမပြင်ဆင်ရန်", importCsv: "CSV ထည့်သွင်းရန်", searchStudents: "ကျောင်းသားအမည်၊ ခုံအမှတ် သို့မဟုတ် အထူးပြုဘာသာဖြင့် ရှာပါ...", searchTeachers: "ဆရာ/ဆရာမ၊ ဖုန်း၊ အီးမေးလ် သို့မဟုတ် ဌာနဖြင့် ရှာပါ...", noStudents: "ကျောင်းသားမရှိသေးပါ။", noTeachers: "ဆရာ/ဆရာမမရှိသေးပါ။", selectDepartment: "ဌာနရွေးချယ်ပါ", noRental: "ငှားရမ်းမှုမရှိ", borrowerRole: "ငှားရမ်းသူအမျိုးအစား", allMajors: "အထူးပြုဘာသာအားလုံး", allBatches: "အတန်းအားလုံး", selected: "ရွေးချယ်ထားသည်", shown: "ပြသထားသည်", selectAllEligible: "ငှားရမ်းနိုင်သူအားလုံးရွေးရန်", qrLaptops: "QR လက်ပ်တော့များ", issuedDate: "ထုတ်ပေးသည့်ရက်", expectedReturnDate: "ပြန်အပ်မည့်ရက်", confirmRental: "ငှားရမ်းမှုအတည်ပြုရန်", bulkIssueRental: "လက်ပ်တော့များ အစုလိုက်ငှားပေးရန်", assignLaptops: "QR ပါသော လက်ပ်တော့များကို ကျောင်းသား သို့မဟုတ် ဆရာ/ဆရာမများထံ ထုတ်ပေးပါ။", alreadyRented: "ငှားရမ်းထားပြီး", loading: "ခေတ္တစောင့်ပါ...", manageStudents: "လက်ပ်တော့ငှားရမ်းမှုအတွက် ကျောင်းသားများကို ထည့်သွင်း၊ ရှာဖွေ၊ ပြင်ဆင် သို့မဟုတ် ဖျက်နိုင်ပါသည်။", manageTeachers: "ဆရာ/ဆရာမများကို ထည့်သွင်းပါ။ ထို့နောက် ငှားရမ်းထုတ်ပေးရာတွင် ရွေးချယ်နိုင်ပါမည်။", update: "ပြင်ဆင်ရန်",
  },
} as const;

const departmentUiTranslations = {
  eng: {
    departments: "Departments", searchDepartments: "Search by department or room", departmentClassroom: "Department / Classroom", noDepartments: "No department records found.", closed: "Closed", addRoom: "Add Room", editRoom: "Edit Room", updateRoom: "Update this room under its department.", enterRoom: "Choose the department and enter its room number.", roomNumber: "Room Number", selectStatus: "Select status", saveChanges: "Save Changes", confirm: "Confirm",
  },
  mm: {
    departments: "ဌာနများ", searchDepartments: "ဌာန သို့မဟုတ် အခန်းဖြင့် ရှာပါ", departmentClassroom: "ဌာန / စာသင်ခန်း", noDepartments: "ဌာနစာရင်းများ မရှိသေးပါ။", closed: "ပိတ်ထားသည်", addRoom: "အခန်းထည့်ရန်", editRoom: "အခန်းပြင်ရန်", updateRoom: "ဤဌာနအောက်ရှိ အခန်းကို ပြင်ဆင်ပါ။", enterRoom: "ဌာနကိုရွေးပြီး အခန်းနံပါတ်ထည့်ပါ။", roomNumber: "အခန်းနံပါတ်", selectStatus: "အခြေအနေရွေးပါ", saveChanges: "ပြင်ဆင်ချက်များသိမ်းရန်", confirm: "အတည်ပြုရန်",
  },
} as const;

const profileUiTranslations = {
  eng: {
    myProfile: "My Profile", manageProfile: "Manage your account information and access level.", editProfile: "Edit profile", active: "Active", accountAccess: "Account Access", administratorAccess: "Administrator access to all modules and settings.", viewPermissions: "View permissions", personalInformation: "Personal Information", fullName: "Full name", emailAddress: "Email address", accountStatus: "Account status", notProvided: "Not provided", notAssigned: "Not assigned", editProfileTitle: "Edit Profile", editProfileDescription: "Update the account details shown in your profile.", profilePhoto: "Profile photo", uploadImage: "Upload a JPG, PNG, or other image file.", removePhoto: "Remove photo", enterName: "Enter your name", accountRole: "Account role", roleManaged: "Your access role is managed by a system administrator.", saving: "Saving...", permissionsDescription: "As an administrator, you can view, add, edit, and delete records in the following sections.", permissionsManaged: "Permissions are managed by a system administrator.", academicYears: "Academic Years",
  },
  mm: {
    myProfile: "ကိုယ်ရေးအချက်အလက်", manageProfile: "သင့်အကောင့်အချက်အလက်နှင့် ဝင်ရောက်ခွင့်အဆင့်ကို စီမံခန့်ခွဲပါ။", editProfile: "ကိုယ်ရေးအချက်အလက်ပြင်ရန်", active: "အသုံးပြုနေသည်", accountAccess: "အကောင့်ဝင်ရောက်ခွင့်", administratorAccess: "စနစ်၏ကဏ္ဍများနှင့် ဆက်တင်များအားလုံးကို စီမံခန့်ခွဲသူအဖြစ် ဝင်ရောက်နိုင်သည်။", viewPermissions: "ခွင့်ပြုချက်များကြည့်ရန်", personalInformation: "ကိုယ်ရေးအချက်အလက်", fullName: "အမည်အပြည့်အစုံ", emailAddress: "အီးမေးလ်လိပ်စာ", accountStatus: "အကောင့်အခြေအနေ", notProvided: "မထည့်သွင်းရသေးပါ", notAssigned: "မသတ်မှတ်ရသေးပါ", editProfileTitle: "ကိုယ်ရေးအချက်အလက်ပြင်ရန်", editProfileDescription: "သင့်ကိုယ်ရေးအချက်အလက်တွင် ပြသထားသော အကောင့်အသေးစိတ်များကို ပြင်ဆင်ပါ။", profilePhoto: "ကိုယ်ရေးဓာတ်ပုံ", uploadImage: "JPG, PNG သို့မဟုတ် အခြားပုံဖိုင်တစ်ခု တင်ပါ။", removePhoto: "ဓာတ်ပုံဖယ်ရှားရန်", enterName: "သင့်အမည်ထည့်ပါ", accountRole: "အကောင့်အခန်းကဏ္ဍ", roleManaged: "သင့်ဝင်ရောက်ခွင့်အခန်းကဏ္ဍကို စနစ်စီမံခန့်ခွဲသူက စီမံပါသည်။", saving: "သိမ်းဆည်းနေသည်...", permissionsDescription: "စီမံခန့်ခွဲသူအဖြစ် အောက်ပါကဏ္ဍများရှိ စာရင်းများကို ကြည့်ရှု၊ ထည့်သွင်း၊ ပြင်ဆင် နှင့် ဖျက်နိုင်ပါသည်။", permissionsManaged: "ခွင့်ပြုချက်များကို စနစ်စီမံခန့်ခွဲသူက စီမံပါသည်။", academicYears: "ပညာသင်နှစ်များ",
  },
} as const;

const academicYearUiTranslations = {
  eng: {
    manageAcademicYears: "Manage academic years and current sessions.", addAcademicYear: "Add Academic Year", editAcademicYear: "Edit Academic Year", deleteAcademicYear: "Delete Academic Year", searchAcademicYears: "Search academic year...", currentAcademicYear: "Current Academic Year", noSemesters: "No semesters configured yet.", noAcademicYears: "No academic years found.", inactive: "Inactive", startDate: "Start Date", endDate: "End Date", day: "Day", month: "Month", year: "Year", save: "Save", january: "January", february: "February", march: "March", april: "April", may: "May", june: "June", july: "July", august: "August", september: "September", october: "October", november: "November", december: "December",
  },
  mm: {
    manageAcademicYears: "ပညာသင်နှစ်များနှင့် လက်ရှိသင်တန်းကာလများကို စီမံခန့်ခွဲပါ။", addAcademicYear: "ပညာသင်နှစ်ထည့်ရန်", editAcademicYear: "ပညာသင်နှစ်ပြင်ရန်", deleteAcademicYear: "ပညာသင်နှစ်ဖျက်ရန်", searchAcademicYears: "ပညာသင်နှစ်ရှာပါ...", currentAcademicYear: "လက်ရှိပညာသင်နှစ်", noSemesters: "စာသင်ကာလများ မသတ်မှတ်ရသေးပါ။", noAcademicYears: "ပညာသင်နှစ်များ မရှိသေးပါ။", inactive: "အသုံးမပြုပါ", startDate: "စတင်ရက်", endDate: "ပြီးဆုံးရက်", day: "ရက်", month: "လ", year: "နှစ်", save: "သိမ်းဆည်းရန်", january: "ဇန်နဝါရီ", february: "ဖေဖော်ဝါရီ", march: "မတ်", april: "ဧပြီ", may: "မေ", june: "ဇွန်", july: "ဇူလိုင်", august: "ဩဂုတ်", september: "စက်တင်ဘာ", october: "အောက်တိုဘာ", november: "နိုဝင်ဘာ", december: "ဒီဇင်ဘာ",
  },
} as const;

const academicYearDialogTranslations = {
  eng: { deleteAcademicWarning: "Are you sure you want to delete this academic year? This action cannot be undone.", confirmDelete: "Confirm Delete" },
  mm: { deleteAcademicWarning: "ဤပညာသင်နှစ်ကို ဖျက်လိုသည်မှာ သေချာပါသလား။ ဤလုပ်ဆောင်ချက်ကို ပြန်လည်ရယူ၍ မရနိုင်ပါ။", confirmDelete: "ဖျက်ရန်အတည်ပြုပါ" },
} as const;

const historyUiTranslations = {
  eng: {
    history: "History", historyDescription: "Track who added, edited, or deleted each system record.", exportCsv: "Export CSV", searchHistory: "Search record or user", allActions: "All actions", allModules: "All modules", clear: "Clear", from: "From", to: "To", added: "Added", edited: "Edited", deleted: "Deleted", noActivity: "No matching activity yet.", activityWillAppear: "New additions, edits, and deletions will appear here.", loadingHistory: "Loading activity history...", notSet: "Not set", noDetails: "No additional details recorded.", performedBy: "Performed by", record: "Record", recordId: "Record ID", date: "Date", module: "Module", details: "Details",
  },
  mm: {
    history: "မှတ်တမ်း", historyDescription: "စနစ်စာရင်းတစ်ခုစီကို မည်သူက ထည့်သွင်း၊ ပြင်ဆင် သို့မဟုတ် ဖျက်ခဲ့သည်ကို ကြည့်ရှုပါ။", exportCsv: "CSV ထုတ်ယူရန်", searchHistory: "စာရင်း သို့မဟုတ် အသုံးပြုသူရှာပါ", allActions: "လုပ်ဆောင်မှုအားလုံး", allModules: "ကဏ္ဍအားလုံး", clear: "ရှင်းလင်းရန်", from: "မှ", to: "သို့", added: "ထည့်သွင်းခဲ့သည်", edited: "ပြင်ဆင်ခဲ့သည်", deleted: "ဖျက်ခဲ့သည်", noActivity: "ကိုက်ညီသော လှုပ်ရှားမှုမှတ်တမ်း မရှိသေးပါ။", activityWillAppear: "ထည့်သွင်းခြင်း၊ ပြင်ဆင်ခြင်း နှင့် ဖျက်ခြင်းမှတ်တမ်းများကို ဤနေရာတွင် ပြသပါမည်။", loadingHistory: "လှုပ်ရှားမှုမှတ်တမ်းများ တင်နေသည်...", notSet: "မသတ်မှတ်ရသေးပါ", noDetails: "နောက်ထပ်အသေးစိတ် မရှိပါ။", performedBy: "လုပ်ဆောင်သူ", record: "စာရင်း", recordId: "စာရင်း ID", date: "ရက်စွဲ", module: "ကဏ္ဍ", details: "အသေးစိတ်",
  },
} as const;

const translations = {
  eng: {
    ...rentalUiTranslations.eng,
    ...departmentUiTranslations.eng,
    ...profileUiTranslations.eng,
    ...academicYearUiTranslations.eng,
    ...academicYearDialogTranslations.eng,
    ...historyUiTranslations.eng,
    dashboard: "Dashboard", academicYear: "Academic Year", department: "Department", category: "Category", status: "Status", all: "All",
    totalItems: "Total Items", allTrackedUnits: "All tracked units", available: "Available", readyForUse: "Ready for use", inUse: "In Use", issuedUnits: "Issued units",
    damagedMaintenance: "Damaged / Maintenance", needsAttention: "Needs attention", inventoryHealth: "Inventory Health", departmentOverview: "Department Overview",
    storeItems: "Store Items", selectedDepartment: "Selected department", clickDepartment: "Click a department in the chart to view its items.",
    item: "Item", image: "Image", quantity: "Quantity", actions: "Actions", damaged: "Damaged", total: "Total", noItemRecords: "No item records match this department.",
    page: "Page", of: "of", recentlyAddedItems: "Recently Added Items", viewAll: "View All", itemId: "Item ID", itemName: "Item Name", dateAdded: "Date Added", noRecentItems: "No recently added items yet.",
    items: "items", light: "Light", dark: "Dark",
    inventory: "Inventory", accessories: "Accessories Detail", laptopRental: "Laptop Rental Service", settings: "Settings", administrator: "Administrator", fullSystemAccess: "Full System Access", signOut: "Sign Out",
    import: "Import", export: "Export", addItem: "Add Item", allCategories: "All Categories", addCategory: "Add Category", categoryName: "Category name", cancel: "Cancel", add: "Add", searchInventory: "Search inventory...", noInventoryItems: "No inventory items found.", noImage: "No Image", units: "Units", outOfStock: "Out of Stock", preview: "Preview",
    manageAccessoryRecords: "Manage accessory details and records", room: "Room", transfer: "Transfer", search: "Search", searchById: "Search by ID", selectDate: "Select Date", allAcademicYears: "All Academic Years", selectRegistrationYear: "Select a registration year.", chooseRegistrationDate: "Choose registration date", pickRegistrationDate: "Pick a registration date.", none: "None", remark: "Remark", edit: "Edit", delete: "Delete", qrCode: "QR Code", action: "Action",
    manageRentalRecords: "Manage laptop rental requests and records", studentList: "Student List", teacherList: "Teacher List", issueRental: "Issue Rental", allQuantity: "All Quantity", pendingQuantity: "Pending Quantity", inUseQuantity: "In Use Quantity", availableQuantity: "Available Quantity", role: "Role", borrower: "Borrower", laptop: "Laptop", inventoryQr: "Inventory QR", returnDate: "Return Date", approved: "Approved", pending: "Pending", returned: "Returned", rejected: "Rejected", searchRentals: "Search by borrower name, roll number, laptop, or QR...", noRentalRecords: "No laptop rental records match the current filters.", loadingRentalRecords: "Loading rental records...",
  },
  mm: {
    ...rentalUiTranslations.mm,
    ...departmentUiTranslations.mm,
    ...profileUiTranslations.mm,
    ...academicYearUiTranslations.mm,
    ...academicYearDialogTranslations.mm,
    ...historyUiTranslations.mm,
    dashboard: "ဒက်ရှ်ဘုတ်", academicYear: "ပညာသင်နှစ်", department: "ဌာန", category: "အမျိုးအစား", status: "အခြေအနေ", all: "အားလုံး",
    totalItems: "စုစုပေါင်းပစ္စည်းများ", allTrackedUnits: "စာရင်းသွင်းထားသည့် ပစ္စည်းအားလုံး", available: "ရရှိနိုင်", readyForUse: "အသုံးပြုရန် အဆင်သင့်", inUse: "အသုံးပြုနေသည်", issuedUnits: "ထုတ်ပေးထားသည့် ပစ္စည်းများ",
    damagedMaintenance: "ပျက်စီး / ပြုပြင်ရန်", needsAttention: "စစ်ဆေးရန်လိုအပ်သည်", inventoryHealth: "ပစ္စည်းစာရင်း အခြေအနေ", departmentOverview: "ဌာနအလိုက် အကျဉ်းချုပ်",
    storeItems: "စတိုးပစ္စည်းများ", selectedDepartment: "ရွေးချယ်ထားသော ဌာန", clickDepartment: "ပစ္စည်းများကြည့်ရန် ဇယားရှိ ဌာနကို ရွေးပါ။",
    item: "ပစ္စည်း", image: "ပုံ", quantity: "အရေအတွက်", actions: "လုပ်ဆောင်ချက်များ", damaged: "ပျက်စီး", total: "စုစုပေါင်း", noItemRecords: "ဤဌာနအတွက် ပစ္စည်းစာရင်း မတွေ့ပါ။",
    page: "စာမျက်နှာ", of: "မှ", recentlyAddedItems: "မကြာသေးမီက ထည့်သွင်းထားသော ပစ္စည်းများ", viewAll: "အားလုံးကြည့်ရန်", itemId: "ပစ္စည်း ID", itemName: "ပစ္စည်းအမည်", dateAdded: "ထည့်သွင်းသည့်ရက်", noRecentItems: "မကြာသေးမီက ထည့်သွင်းထားသော ပစ္စည်းမရှိသေးပါ။",
    items: "ပစ္စည်းများ", light: "အလင်း", dark: "အမှောင်",
    inventory: "ပစ္စည်းစာရင်း", accessories: "ပစ္စည်းအသေးစိတ်", laptopRental: "လက်ပ်တော့ ငှားရမ်းဝန်ဆောင်မှု", settings: "ဆက်တင်များ", administrator: "စီမံခန့်ခွဲသူ", fullSystemAccess: "စနစ်အပြည့်အစုံ အသုံးပြုခွင့်", signOut: "ထွက်ရန်",
    import: "တင်သွင်းရန်", export: "ထုတ်ယူရန်", addItem: "ပစ္စည်းထည့်ရန်", allCategories: "အမျိုးအစားအားလုံး", addCategory: "အမျိုးအစားထည့်ရန်", categoryName: "အမျိုးအစားအမည်", cancel: "မလုပ်တော့ပါ", add: "ထည့်ရန်", searchInventory: "ပစ္စည်းစာရင်း ရှာရန်...", noInventoryItems: "ပစ္စည်းစာရင်း မတွေ့ပါ။", noImage: "ပုံမရှိ", units: "ခု", outOfStock: "လက်ကျန်မရှိ", preview: "အစမ်းကြည့်ရန်",
    manageAccessoryRecords: "ပစ္စည်းအသေးစိတ်နှင့် စာရင်းများကို စီမံခန့်ခွဲပါ", room: "အခန်း", transfer: "လွှဲပြောင်းရန်", search: "ရှာရန်", searchById: "ID ဖြင့်ရှာရန်", selectDate: "ရက်စွဲရွေးရန်", allAcademicYears: "ပညာသင်နှစ်အားလုံး", selectRegistrationYear: "မှတ်ပုံတင်နှစ်ကို ရွေးပါ။", chooseRegistrationDate: "မှတ်ပုံတင်ရက်ကို ရွေးပါ", pickRegistrationDate: "မှတ်ပုံတင်ရက်ကို ရွေးချယ်ပါ။", none: "မရှိ", remark: "မှတ်ချက်", edit: "ပြင်ဆင်ရန်", delete: "ဖျက်ရန်", qrCode: "QR ကုဒ်", action: "လုပ်ဆောင်ချက်",
    manageRentalRecords: "လက်ပ်တော့ ငှားရမ်းတောင်းဆိုမှုများနှင့် စာရင်းများကို စီမံခန့်ခွဲပါ", studentList: "ကျောင်းသားစာရင်း", teacherList: "ဆရာစာရင်း", issueRental: "ငှားရမ်းထုတ်ပေးရန်", allQuantity: "စုစုပေါင်း အရေအတွက်", pendingQuantity: "စောင့်ဆိုင်းနေသော အရေအတွက်", inUseQuantity: "အသုံးပြုနေသော အရေအတွက်", availableQuantity: "ရရှိနိုင်သော အရေအတွက်", role: "အခန်းကဏ္ဍ", borrower: "ငှားယူသူ", laptop: "လက်ပ်တော့", inventoryQr: "ပစ္စည်းစာရင်း QR", returnDate: "ပြန်အပ်ရက်", approved: "အတည်ပြုပြီး", pending: "စောင့်ဆိုင်းနေသည်", returned: "ပြန်အပ်ပြီး", rejected: "ငြင်းပယ်ပြီး", searchRentals: "ငှားယူသူအမည်၊ ခုံအမှတ်၊ လက်ပ်တော့ သို့မဟုတ် QR ဖြင့် ရှာရန်...", noRentalRecords: "လက်ရှိ စစ်ထုတ်မှုနှင့် ကိုက်ညီသော ငှားရမ်းမှတ်တမ်း မရှိပါ။", loadingRentalRecords: "ငှားရမ်းမှတ်တမ်းများ ဖွင့်နေသည်...",
  },
} as const;

/*
 * Shared labels that appear across pages.  Most older screens contain plain
 * English JSX instead of calling `t()`, so this dictionary is also used by the
 * page-wide translator below.  Stored data (item names, user names, IDs, etc.)
 * is deliberately not translated.
 */
const myanmarUiText: Record<string, string> = {
  "Dashboard": "ဒက်ရှ်ဘုတ်",
  "Inventory": "ပစ္စည်းစာရင်း",
  "Accessories": "အပိုပစ္စည်းများ",
  "Accessories Detail": "အပိုပစ္စည်း အသေးစိတ်",
  "Accessories Details": "အပိုပစ္စည်း အသေးစိတ်",
  "Laptop Rental": "လက်ပ်တော့ ငှားရမ်းမှု",
  "Laptop Rental Service": "လက်ပ်တော့ ငှားရမ်းမှု",
  "Departments": "ဌာနများ",
  "Settings": "ဆက်တင်များ",
  "Users": "အသုံးပြုသူများ",
  "User Management": "အသုံးပြုသူ စီမံခန့်ခွဲမှု",
  "Sign Out": "ထွက်ရန်",
  "Import": "တင်သွင်းရန်",
  "Export": "ထုတ်ယူရန်",
  "Add Item": "ပစ္စည်းထည့်ရန်",
  "Add Category": "အမျိုးအစားထည့်ရန်",
  "Add Department": "ဌာနထည့်ရန်",
  "Add Room": "အခန်းထည့်ရန်",
  "Add User": "အသုံးပြုသူထည့်ရန်",
  "Edit": "ပြင်ဆင်ရန်",
  "Delete": "ဖျက်ရန်",
  "Save": "သိမ်းဆည်းရန်",
  "Save Changes": "ပြောင်းလဲမှုများ သိမ်းဆည်းရန်",
  "Cancel": "မလုပ်တော့ပါ",
  "Close": "ပိတ်ရန်",
  "Confirm": "အတည်ပြုရန်",
  "Search": "ရှာဖွေရန်",
  "Search...": "ရှာဖွေရန်...",
  "Search inventory...": "ပစ္စည်းစာရင်း ရှာဖွေရန်...",
  "All": "အားလုံး",
  "All Category": "အမျိုးအစားအားလုံး",
  "All Categories": "အမျိုးအစားအားလုံး",
  "Category": "အမျိုးအစား",
  "Category name": "အမျိုးအစားအမည်",
  "Item": "ပစ္စည်း",
  "Items": "ပစ္စည်းများ",
  "Item Name": "ပစ္စည်းအမည်",
  "Item ID": "ပစ္စည်း ID",
  "ID": "ID",
  "Image": "ပုံ",
  "Quantity": "အရေအတွက်",
  "Units": "ယူနစ်",
  "Status": "အခြေအနေ",
  "Actions": "လုပ်ဆောင်ချက်များ",
  "Action": "လုပ်ဆောင်ချက်",
  "QR Code": "QR ကုဒ်",
  "Department": "ဌာန",
  "Room": "အခန်း",
  "Transfer": "လွှဲပြောင်းရန်",
  "Academic Year": "ပညာသင်နှစ်",
  "Available": "အသုံးပြုနိုင်သည်",
  "In Use": "အသုံးပြုနေသည်",
  "Damaged": "ပျက်စီးနေသည်",
  "Pending": "စောင့်ဆိုင်းနေသည်",
  "Approved": "အတည်ပြုပြီး",
  "Returned": "ပြန်အပ်ပြီး",
  "Rejected": "ငြင်းပယ်ပြီး",
  "Active": "အသုံးပြုနေသည်",
  "Inactive": "အသုံးမပြုပါ",
  "Out of Stock": "လက်ကျန်မရှိပါ",
  "No Image": "ပုံမရှိပါ",
  "No inventory items found.": "ပစ္စည်းစာရင်း မတွေ့ပါ။",
  "Manage accessory details and records": "အပိုပစ္စည်း အသေးစိတ်နှင့် မှတ်တမ်းများကို စီမံခန့်ခွဲပါ",
  "Manage laptop rental requests and records": "လက်ပ်တော့ ငှားရမ်းမှု တောင်းဆိုချက်များနှင့် မှတ်တမ်းများကို စီမံခန့်ခွဲပါ",
  "Student List": "ကျောင်းသားစာရင်း",
  "Teacher List": "ဆရာ/ဆရာမစာရင်း",
  "Issue Rental": "ငှားရမ်းထုတ်ပေးရန်",
  "Borrower": "ငှားရမ်းသူ",
  "Role": "အခန်းကဏ္ဍ",
  "Laptop": "လက်ပ်တော့",
  "Inventory QR": "ပစ္စည်းစာရင်း QR",
  "Return Date": "ပြန်အပ်ရမည့်ရက်",
  "All Quantity": "စုစုပေါင်း အရေအတွက်",
  "Pending Quantity": "စောင့်ဆိုင်း အရေအတွက်",
  "In Use Quantity": "အသုံးပြုနေသော အရေအတွက်",
  "Available Quantity": "အသုံးပြုနိုင်သော အရေအတွက်",
  "Preferences": "နှစ်သက်ရာ ဆက်တင်များ",
  "Language": "ဘာသာစကား",
  "Theme": "အသွင်အပြင်",
  "Light": "အလင်း",
  "Dark": "အမှောင်",
  "English": "အင်္ဂလိပ်",
  "Myanmar": "မြန်မာ",
  "Adjust language and display settings.": "ဘာသာစကားနှင့် မျက်နှာပြင်ဆက်တင်များကို ပြင်ဆင်ပါ။",
  "Choose the language used in the system.": "စနစ်တွင် အသုံးပြုမည့် ဘာသာစကားကို ရွေးပါ။",
  "Switch between light and dark appearance.": "အလင်းနှင့် အမှောင်အသွင်အပြင်အကြား ပြောင်းလဲပါ။",
  "Switch to light mode": "အလင်းမုဒ်သို့ ပြောင်းရန်",
  "Switch to dark mode": "အမှောင်မုဒ်သို့ ပြောင်းရန်",
  "My Profile": "ကျွန်ုပ်၏ ကိုယ်ရေးအချက်အလက်",
  "Edit Profile": "ကိုယ်ရေးအချက်အလက် ပြင်ဆင်ရန်",
  "Edit profile": "ကိုယ်ရေးအချက်အလက် ပြင်ဆင်ရန်",
  "Manage your account information and access level.": "သင့်အကောင့်အချက်အလက်နှင့် အသုံးပြုခွင့်အဆင့်ကို စီမံခန့်ခွဲပါ။",
  "Account Access": "အကောင့် အသုံးပြုခွင့်",
  "Full System Access": "စနစ်တစ်ခုလုံး အသုံးပြုခွင့်",
  "Administrator access to all modules and settings.": "လုပ်ဆောင်မှုအပိုင်းများနှင့် ဆက်တင်များအားလုံးအတွက် စီမံခန့်ခွဲသူ အသုံးပြုခွင့်။",
  "View permissions": "အသုံးပြုခွင့်များ ကြည့်ရန်",
  "Full name": "အမည်အပြည့်အစုံ",
  "Email address": "အီးမေးလ်လိပ်စာ",
  "Phone number": "ဖုန်းနံပါတ်",
  "Account status": "အကောင့်အခြေအနေ",
  "Account role": "အကောင့် အခန်းကဏ္ဍ",
  "Personal Information": "ကိုယ်ရေးအချက်အလက်",
  "Not provided": "မဖော်ပြထားပါ",
  "Not assigned": "မသတ်မှတ်ထားပါ",
  "Academic Years": "ပညာသင်နှစ်များ",
  "Manage academic years and current sessions.": "ပညာသင်နှစ်များနှင့် လက်ရှိကာလများကို စီမံခန့်ခွဲပါ။",
  "Search academic year...": "ပညာသင်နှစ် ရှာဖွေရန်...",
  "Current Academic Year": "လက်ရှိ ပညာသင်နှစ်",
  "No semesters configured yet.": "စာသင်ကာလများ မသတ်မှတ်ရသေးပါ။",
  "History": "မှတ်တမ်း",
  "Track who added, edited, or deleted each system record.": "စနစ်မှတ်တမ်းတစ်ခုစီကို မည်သူက ထည့်သွင်း၊ ပြင်ဆင် သို့မဟုတ် ဖျက်ခဲ့သည်ကို ကြည့်ရှုပါ။",
  "Export CSV": "CSV ထုတ်ယူရန်",
  "Search record or user": "မှတ်တမ်း သို့မဟုတ် အသုံးပြုသူ ရှာရန်",
  "All actions": "လုပ်ဆောင်ချက်အားလုံး",
  "All modules": "လုပ်ဆောင်မှုအပိုင်းအားလုံး",
  "Clear": "ရှင်းလင်းရန်",
  "From": "မှ",
  "To": "သို့",
  "Edited": "ပြင်ဆင်ပြီး",
  "Added": "ထည့်သွင်းပြီး",
  "Deleted": "ဖျက်ပြီး",
  "Profile": "ကိုယ်ရေးအချက်အလက်",
  "profile image: updated": "ကိုယ်ရေးပုံ ပြင်ဆင်ပြီး",
  "Loading...": "လုပ်ဆောင်နေသည်...",
  "Loading profile...": "ကိုယ်ရေးအချက်အလက် ဖွင့်နေသည်...",
  "Try again": "ထပ်မံကြိုးစားရန်",
  "Welcome Back": "ပြန်လည်ကြိုဆိုပါသည်",
  "Back to Login": "အကောင့်ဝင်ရန်သို့ ပြန်သွားရန်",
  "Sign in": "အကောင့်ဝင်ရန်",
  "Password": "စကားဝှက်",
  "Email": "အီးမေးလ်",
  "ADMIN": "စီမံခန့်ခွဲသူ",
  "Administrator": "စီမံခန့်ခွဲသူ",
  "MIIT Store Administrator": "MIIT Store စီမံခန့်ခွဲသူ",
  "All Academic Years": "ပညာသင်နှစ်အားလုံး",
  "All Departments": "ဌာနအားလုံး",
  "All Status": "အခြေအနေအားလုံး",
  "All Actions": "လုပ်ဆောင်ချက်အားလုံး",
  "All Modules": "လုပ်ဆောင်မှုအပိုင်းအားလုံး",
  "Department Overview": "ဌာနအကျဉ်းချုပ်",
  "Inventory Health": "ပစ္စည်းစာရင်း အခြေအနေ",
  "Store Items": "သိုလှောင်ပစ္စည်းများ",
  "Recently Added Items": "မကြာသေးမီက ထည့်သွင်းထားသော ပစ္စည်းများ",
  "View All": "အားလုံးကြည့်ရန်",
  "Total Items": "စုစုပေါင်း ပစ္စည်းများ",
  "Ready for use": "အသုံးပြုရန် အဆင်သင့်",
  "Issued units": "ထုတ်ပေးထားသော ယူနစ်များ",
  "Damaged / Maintenance": "ပျက်စီး / ပြုပြင်ထိန်းသိမ်းရန်",
  "Needs attention": "ဂရုပြုရန် လိုအပ်သည်",
  "No item records match this department.": "ဤဌာနနှင့် ကိုက်ညီသော ပစ္စည်းမှတ်တမ်း မရှိပါ။",
  "No recently added items yet.": "မကြာသေးမီက ထည့်သွင်းထားသော ပစ္စည်း မရှိသေးပါ။",
  "No item records found.": "ပစ္စည်းမှတ်တမ်း မတွေ့ပါ။",
  "Select department": "ဌာနရွေးပါ",
  "Select status": "အခြေအနေရွေးပါ",
  "Select category": "အမျိုးအစားရွေးပါ",
  "No Rental": "ငှားရမ်းမှုမရှိပါ",
  "No students found.": "ကျောင်းသား မတွေ့ပါ။",
  "No teachers found.": "ဆရာ/ဆရာမ မတွေ့ပါ။",
  "Student": "ကျောင်းသား",
  "Teacher": "ဆရာ/ဆရာမ",
  "Student name": "ကျောင်းသားအမည်",
  "Teacher name": "ဆရာ/ဆရာမအမည်",
  "Roll number": "ခုံအမှတ်",
  "Major": "အထူးပြုဘာသာ",
  "Batch": "အတန်းခွဲ",
  "Add Student": "ကျောင်းသားထည့်ရန်",
  "Add Teacher": "ဆရာ/ဆရာမ ထည့်ရန်",
  "Update Student": "ကျောင်းသား အချက်အလက်ပြင်ရန်",
  "Update Teacher": "ဆရာ/ဆရာမ အချက်အလက်ပြင်ရန်",
  "Search by borrower name, roll number, laptop, or QR...": "ငှားရမ်းသူအမည်၊ ခုံအမှတ်၊ လက်ပ်တော့ သို့မဟုတ် QR ဖြင့် ရှာရန်...",
  "No laptop rental records match the current filters.": "ရွေးချယ်ထားသော စစ်ထုတ်မှုနှင့် ကိုက်ညီသည့် ငှားရမ်းမှုမှတ်တမ်း မရှိပါ။",
  "Loading rental records...": "ငှားရမ်းမှုမှတ်တမ်းများ ဖွင့်နေသည်...",
  "Create and manage authorized MIIT Store accounts.": "MIIT Store အသုံးပြုသူအကောင့်များကို ဖန်တီးပြီး စီမံခန့်ခွဲပါ။",
  "Create user": "အသုံးပြုသူ ဖန်တီးရန်",
  "Edit user": "အသုံးပြုသူ ပြင်ဆင်ရန်",
  "Name": "အမည်",
  "Temporary password": "ယာယီစကားဝှက်",
  "Create User": "အသုံးပြုသူ ဖန်တီးရန်",
  "Update User": "အသုံးပြုသူ ပြင်ဆင်ရန်",
  "Add Academic Year": "ပညာသင်နှစ် ထည့်ရန်",
  "Edit Academic Year": "ပညာသင်နှစ် ပြင်ဆင်ရန်",
  "Delete Academic Year": "ပညာသင်နှစ် ဖျက်ရန်",
  "Start Date": "စတင်ရက်",
  "End Date": "ပြီးဆုံးရက်",
  "Day": "ရက်",
  "Month": "လ",
  "Year": "နှစ်",
  "January": "ဇန်နဝါရီ",
  "February": "ဖေဖော်ဝါရီ",
  "March": "မတ်",
  "April": "ဧပြီ",
  "May": "မေ",
  "June": "ဇွန်",
  "July": "ဇူလိုင်",
  "August": "ဩဂုတ်",
  "September": "စက်တင်ဘာ",
  "October": "အောက်တိုဘာ",
  "November": "နိုဝင်ဘာ",
  "December": "ဒီဇင်ဘာ",
  // Departments, users, history, and shared dialogs
  "Search by department or room": "ဌာန သို့မဟုတ် အခန်းဖြင့် ရှာရန်",
  "Search name or email": "အမည် သို့မဟုတ် အီးမေးလ်ဖြင့် ရှာရန်",
  "Select role": "အခန်းကဏ္ဍ ရွေးပါ",
  "No department": "ဌာန မသတ်မှတ်ထားပါ",
  "Save changes": "ပြောင်းလဲမှုများ သိမ်းဆည်းရန်",
  "Saving...": "သိမ်းဆည်းနေသည်...",
  "Saving…": "သိမ်းဆည်းနေသည်...",
  "No users found.": "အသုံးပြုသူ မတွေ့ပါ။",
  "Loading users...": "အသုံးပြုသူများ ဖွင့်နေသည်...",
  "Security": "လုံခြုံရေး",
  "Manage account protection and access controls.": "အကောင့်လုံခြုံရေးနှင့် အသုံးပြုခွင့်များကို စီမံခန့်ခွဲပါ။",
  "System notifications": "စနစ်အကြောင်းကြားချက်များ",
  "Receive alerts about system changes.": "စနစ်ပြောင်းလဲမှုများအတွက် အကြောင်းကြားချက်များ ရယူပါ။",
  "Enabled": "ဖွင့်ထားသည်",
  "Search history": "မှတ်တမ်း ရှာရန်",
  "Filter by action": "လုပ်ဆောင်ချက်ဖြင့် စစ်ထုတ်ရန်",
  "Filter by module": "လုပ်ဆောင်မှုအပိုင်းဖြင့် စစ်ထုတ်ရန်",
  "Loading activity history...": "လုပ်ဆောင်မှုမှတ်တမ်း ဖွင့်နေသည်...",
  "Loading activity history…": "လုပ်ဆောင်မှုမှတ်တမ်း ဖွင့်နေသည်...",
  "No matching activity yet.": "ကိုက်ညီသော လုပ်ဆောင်မှုမှတ်တမ်း မရှိသေးပါ။",
  "New additions, edits, and deletions will appear here.": "ထည့်သွင်းမှု၊ ပြင်ဆင်မှုနှင့် ဖျက်မှုအသစ်များကို ဤနေရာတွင် ပြသပါမည်။",
  "No additional details recorded.": "ထပ်ဆောင်းအသေးစိတ် မမှတ်တမ်းတင်ထားပါ။",
  "Accessory Action": "အပိုပစ္စည်း လုပ်ဆောင်ချက်",
  "Confirm Delete": "ဖျက်ရန် အတည်ပြုပါ",
  "Done": "ပြီးပါပြီ",
  "Current Department": "လက်ရှိဌာန",
  "Current Room": "လက်ရှိအခန်း",
  "No room assigned.": "အခန်း မသတ်မှတ်ထားပါ။",
  "No remark added.": "မှတ်ချက် မထည့်သွင်းထားပါ။",
  "Edit Item": "ပစ္စည်း ပြင်ဆင်ရန်",
  "Update the selected accessory record.": "ရွေးချယ်ထားသော အပိုပစ္စည်းမှတ်တမ်းကို ပြင်ဆင်ပါ။",
  "Create one or more accessory records with generated IDs.": "ထုတ်ပေးထားသော ID များဖြင့် အပိုပစ္စည်းမှတ်တမ်း တစ်ခု သို့မဟုတ် အများအပြား ဖန်တီးပါ။",
  "Accessory name": "အပိုပစ္စည်းအမည်",
  "Select room": "အခန်း ရွေးပါ",
  "Created Date": "ဖန်တီးသည့်ရက်",
  "Add a note for this item": "ဤပစ္စည်းအတွက် မှတ်ချက်ထည့်ပါ",
  "Insert Accessories": "အပိုပစ္စည်းများ ထည့်သွင်းရန်",
  "Export Accessories": "အပိုပစ္စည်းများ ထုတ်ယူရန်",
  "Exported Records": "ထုတ်ယူမည့် မှတ်တမ်းများ",
  "File Name": "ဖိုင်အမည်",
  "No file selected": "ဖိုင် မရွေးချယ်ရသေးပါ",
  "Accessory QR Code Scan": "အပိုပစ္စည်း QR ကုဒ် စကင်ဖတ်ရန်",
  "Access restricted": "အသုံးပြုခွင့် ကန့်သတ်ထားသည်",
  "Go to my workspace": "ကျွန်ုပ်၏ လုပ်ငန်းခွင်သို့ သွားရန်",
  "Checking your session…": "သင့်အသုံးပြုမှုကို စစ်ဆေးနေသည်...",
};

function translateMyanmarText(value: string) {
  const trimmed = value.trim();
  const itemCount = trimmed.match(/^(\d+) Items?$/i);
  const unitCount = trimmed.match(/^(\d+) Units?$/i);
  const translated = myanmarUiText[trimmed]
    ?? (itemCount ? `${itemCount[1]} ပစ္စည်း` : undefined)
    ?? (unitCount ? `${unitCount[1]} ယူနစ်` : undefined);
  if (!translated) return value;
  return value.replace(trimmed, translated);
}

export type TranslationKey = keyof typeof translations.eng;

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
}

type TranslatedValue = { source: string; rendered: string };

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() =>
    localStorage.getItem("language") === "mm" ? "mm" : "eng",
  );
  const originalText = useRef(new WeakMap<Text, TranslatedValue>());
  const originalAttributes = useRef(new WeakMap<Element, Map<string, TranslatedValue>>());

  useEffect(() => {
    let cancelled = false;

    void fetch(`${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000"}/api/profile`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load language preference.");
        return response.json() as Promise<{ ok?: boolean; profile?: { language?: Language } }>;
      })
      .then((payload) => {
        const savedLanguage = payload.profile?.language;
        if (!cancelled && (savedLanguage === "eng" || savedLanguage === "mm")) {
          setLanguage(savedLanguage);
        }
      })
      .catch(() => {
        // Local storage is a safe fallback if the server is temporarily unavailable.
      });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.lang = language === "mm" ? "my" : "en";
  }, [language]);

  useEffect(() => {
    const attributes = ["placeholder", "aria-label", "title"];

    const applyTranslations = () => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const textNodes: Text[] = [];
      let node: Text | null;
      while ((node = walker.nextNode() as Text | null)) textNodes.push(node);

      textNodes.forEach((textNode) => {
        const tag = textNode.parentElement?.tagName;
        if (tag === "SCRIPT" || tag === "STYLE") return;
        const current = textNode.nodeValue ?? "";
        const previous = originalText.current.get(textNode);
        const source = !previous || current !== previous.rendered ? current : previous.source;
        const next = language === "mm" ? translateMyanmarText(source) : source;
        originalText.current.set(textNode, { source, rendered: next });
        if (current !== next) textNode.nodeValue = next;
      });

      document.querySelectorAll<HTMLElement>("[placeholder], [aria-label], [title]").forEach((element) => {
        let saved = originalAttributes.current.get(element);
        if (!saved) {
          saved = new Map<string, TranslatedValue>();
          originalAttributes.current.set(element, saved);
        }
        attributes.forEach((attribute) => {
          const current = element.getAttribute(attribute);
          if (current === null) return;
          const previous = saved.get(attribute);
          const source = !previous || current !== previous.rendered ? current : previous.source;
          const next = language === "mm" ? translateMyanmarText(source) : source;
          saved.set(attribute, { source, rendered: next });
          if (current !== next) element.setAttribute(attribute, next);
        });
      });
    };

    applyTranslations();
    const observer = new MutationObserver(applyTranslations);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: attributes,
    });
    return () => observer.disconnect();
  }, [language]);

  const changeLanguage = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    void fetch(`${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000"}/api/preferences/language`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: nextLanguage }),
    }).catch(() => {
      // Keep the selected language locally if the server cannot be reached.
    });
  };

  const t = (key: TranslationKey) => {
    // Render the canonical source string. The observer above translates it after
    // React commits, which also lets hard-coded and `t()` labels switch together.
    return translations.eng[key];
  };

  return <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>{children}</LanguageContext.Provider>;
}

// This hook is intentionally colocated with its provider so all language state has one source of truth.
// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider.");
  return context;
}
