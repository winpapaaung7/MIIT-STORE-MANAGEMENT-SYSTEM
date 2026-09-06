import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

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

export type TranslationKey = keyof typeof translations.eng;

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() =>
    localStorage.getItem("language") === "mm" ? "mm" : "eng",
  );

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

  const t = (key: TranslationKey) => translations[language][key];

  return <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>{children}</LanguageContext.Provider>;
}

// This hook is intentionally colocated with its provider so all language state has one source of truth.
// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider.");
  return context;
}
