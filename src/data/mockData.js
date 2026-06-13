export const MOCK_DISTRIBUTORS = [
  { id: 1, name: "Ramesh Kumar", village: "Sundarpur", phone: "9876543210", address: "Near Temple, Sundarpur", aadhaar: "XXXX-XXXX-1234", bank: "SBI - 1234567890", milkType: "Cow", joinDate: "2022-01-15", status: "Active", totalLiters: 12450, totalAmount: 623450 },
  { id: 2, name: "Suresh Yadav", village: "Ramgarh", phone: "9812345678", address: "Main Road, Ramgarh", aadhaar: "XXXX-XXXX-5678", bank: "PNB - 9876543210", milkType: "Buffalo", joinDate: "2021-06-20", status: "Active", totalLiters: 18200, totalAmount: 1092000 },
  { id: 3, name: "Priya Devi", village: "Khandwa", phone: "9934567890", address: "Sector 2, Khandwa", aadhaar: "XXXX-XXXX-9012", bank: "BOI - 5678901234", milkType: "Cow", joinDate: "2023-03-10", status: "Active", totalLiters: 6800, totalAmount: 340000 },
  { id: 4, name: "Mohan Singh", village: "Birpur", phone: "9756789012", address: "Old Colony, Birpur", aadhaar: "XXXX-XXXX-3456", bank: "HDFC - 2345678901", milkType: "Buffalo", joinDate: "2020-11-05", status: "Inactive", totalLiters: 21000, totalAmount: 1260000 },
  { id: 5, name: "Gita Sharma", village: "Lakshmipur", phone: "9867890123", address: "Green Field, Lakshmipur", aadhaar: "XXXX-XXXX-7890", bank: "Axis - 3456789012", milkType: "Cow", joinDate: "2022-08-22", status: "Active", totalLiters: 9350, totalAmount: 467500 },
  { id: 6, name: "Vijay Patil", village: "Sundarpur", phone: "9678901234", address: "Near School, Sundarpur", aadhaar: "XXXX-XXXX-2345", bank: "Canara - 4567890123", milkType: "Buffalo", joinDate: "2021-02-14", status: "Active", totalLiters: 15600, totalAmount: 936000 },
];

export const MILK_COLLECTIONS = [
  { id: 1, distributorId: 1, distributorName: "Ramesh Kumar", date: "2025-01-15", shift: "Morning", quantity: 45.5, fat: 3.8, pricePerLiter: 52, total: 2366, status: "Paid" },
  { id: 2, distributorId: 2, distributorName: "Suresh Yadav", date: "2025-01-15", shift: "Morning", quantity: 62, fat: 6.2, pricePerLiter: 62, total: 3844, status: "Paid" },
  { id: 3, distributorId: 3, distributorName: "Priya Devi", date: "2025-01-15", shift: "Evening", quantity: 28, fat: 3.5, pricePerLiter: 50, total: 1400, status: "Pending" },
  { id: 4, distributorId: 5, distributorName: "Gita Sharma", date: "2025-01-15", shift: "Morning", quantity: 38.5, fat: 4.0, pricePerLiter: 54, total: 2079, status: "Paid" },
  { id: 5, distributorId: 6, distributorName: "Vijay Patil", date: "2025-01-15", shift: "Evening", quantity: 55, fat: 5.8, pricePerLiter: 60, total: 3300, status: "Pending" },
  { id: 6, distributorId: 1, distributorName: "Ramesh Kumar", date: "2025-01-14", shift: "Morning", quantity: 43, fat: 3.9, pricePerLiter: 52, total: 2236, status: "Paid" },
  { id: 7, distributorId: 2, distributorName: "Suresh Yadav", date: "2025-01-14", shift: "Evening", quantity: 58, fat: 6.0, pricePerLiter: 62, total: 3596, status: "Paid" },
];

export const MONTHLY_DATA = [
  { month: "Jul", collected: 4200, revenue: 252000, profit: 42000, expense: 210000 },
  { month: "Aug", collected: 4800, revenue: 288000, profit: 51000, expense: 237000 },
  { month: "Sep", collected: 5100, revenue: 306000, profit: 58000, expense: 248000 },
  { month: "Oct", collected: 4600, revenue: 276000, profit: 44000, expense: 232000 },
  { month: "Nov", collected: 5300, revenue: 318000, profit: 63000, expense: 255000 },
  { month: "Dec", collected: 5800, revenue: 348000, profit: 72000, expense: 276000 },
  { month: "Jan", collected: 6200, revenue: 372000, profit: 81000, expense: 291000 },
];

export const DAILY_DATA = [
  { day: "Mon", morning: 185, evening: 142 },
  { day: "Tue", morning: 210, evening: 168 },
  { day: "Wed", morning: 195, evening: 155 },
  { day: "Thu", morning: 228, evening: 180 },
  { day: "Fri", morning: 242, evening: 192 },
  { day: "Sat", morning: 198, evening: 165 },
  { day: "Sun", morning: 175, evening: 138 },
];

export const EXPENSES = [
  { id: 1, category: "Transportation", amount: 12500, date: "2025-01-15", note: "Truck fuel & driver" },
  { id: 2, category: "Storage", amount: 8200, date: "2025-01-15", note: "Cold storage rent" },
  { id: 3, category: "Electricity", amount: 4600, date: "2025-01-14", note: "Monthly electric bill" },
  { id: 4, category: "Staff Salary", amount: 35000, date: "2025-01-10", note: "3 staff members" },
  { id: 5, category: "Maintenance", amount: 2800, date: "2025-01-12", note: "Equipment repair" },
];

export const PAYMENTS = [
  { id: 1, distributorId: 1, distributorName: "Ramesh Kumar", amount: 25400, date: "2025-01-15", method: "UPI", status: "Paid", reference: "UPI202501151" },
  { id: 2, distributorId: 2, distributorName: "Suresh Yadav", amount: 42000, date: "2025-01-15", method: "Bank Transfer", status: "Paid", reference: "NEFT202501152" },
  { id: 3, distributorId: 3, distributorName: "Priya Devi", amount: 18600, date: "2025-01-14", method: "Cash", status: "Pending", reference: "-" },
  { id: 4, distributorId: 5, distributorName: "Gita Sharma", amount: 21200, date: "2025-01-13", method: "UPI", status: "Paid", reference: "UPI202501134" },
  { id: 5, distributorId: 6, distributorName: "Vijay Patil", amount: 33800, date: "2025-01-13", method: "Cash", status: "Pending", reference: "-" },
];

export const NOTIFICATIONS = [
  { id: 1, type: "warning", message: "Pending payment of ₹18,600 from Priya Devi", time: "2h ago", read: false },
  { id: 2, type: "danger", message: "Cold storage at 85% capacity – check inventory", time: "4h ago", read: false },
  { id: 3, type: "info", message: "Monthly report for December is ready to download", time: "1d ago", read: true },
  { id: 4, type: "warning", message: "Pending payment of ₹33,800 from Vijay Patil", time: "1d ago", read: false },
  { id: 5, type: "success", message: "₹42,000 payment received from Suresh Yadav", time: "2d ago", read: true },
];

export const INVENTORY = [
  { id: 1, item: "Fresh Cow Milk", category: "Raw Milk", quantity: 1250, unit: "L", capacity: 2000, minStock: 400, price: 55, expiry: "2025-01-17", status: "Good", location: "Cold Storage 1" },
  { id: 2, item: "Buffalo Milk", category: "Raw Milk", quantity: 820, unit: "L", capacity: 1500, minStock: 300, price: 65, expiry: "2025-01-17", status: "Good", location: "Cold Storage 1" },
  { id: 3, item: "Pasteurized Milk (1L Packet)", category: "Processed Milk", quantity: 340, unit: "pcs", capacity: 1000, minStock: 150, price: 85, expiry: "2025-01-20", status: "Good", location: "Cold Storage 2" },
  { id: 4, item: "Paneer (500g)", category: "Dairy Products", quantity: 45, unit: "kg", capacity: 100, minStock: 20, price: 280, expiry: "2025-01-18", status: "Low", location: "Cold Storage 2" },
  { id: 5, item: "Butter (500g)", category: "Dairy Products", quantity: 12, unit: "kg", capacity: 80, minStock: 30, price: 450, expiry: "2025-01-25", status: "Critical", location: "Cold Storage 2" },
  { id: 6, item: "Curd (1kg)", category: "Dairy Products", quantity: 28, unit: "kg", capacity: 200, minStock: 50, price: 120, expiry: "2025-01-16", status: "Good", location: "Cold Storage 2" },
  { id: 7, item: "Plastic Bottles (1L)", category: "Packaging", quantity: 500, unit: "pcs", capacity: 2000, minStock: 300, price: 8, expiry: "2025-12-31", status: "Good", location: "Dry Storage" },
  { id: 8, item: "Milk Sachets (500ml)", category: "Packaging", quantity: 1200, unit: "pcs", capacity: 5000, minStock: 800, price: 5, expiry: "2025-12-31", status: "Good", location: "Dry Storage" },
];

export const CLIENTS = [
  { id: 1, name: "Fresh Dairy Shop - City Center", type: "Retail Shop", phone: "9876543211", address: "123 Main Road, City Center", city: "Mumbai", contactPerson: "Rajesh Kumar", creditLimit: 50000, outstandingAmount: 12000, status: "Active", joinDate: "2022-03-15" },
  { id: 2, name: "Jai Bhim Milk Cooperative", type: "Cooperative", phone: "9812345679", address: "Market Complex, Ramgarh", city: "Ramgarh", contactPerson: "Suresh Singh", creditLimit: 100000, outstandingAmount: 35000, status: "Active", joinDate: "2021-06-20" },
  { id: 3, name: "Hotel Grand Palace", type: "Hotel/Restaurant", phone: "9934567891", address: "Sector 5, Commercial Area", city: "Mumbai", contactPerson: "Priya Sharma", creditLimit: 75000, outstandingAmount: 8500, status: "Active", joinDate: "2023-01-10" },
  { id: 4, name: "Daily Needs Supermarket", type: "Supermarket", phone: "9756789013", address: "Shopping Mall, Area 2", city: "Mumbai", contactPerson: "Vikram Patel", creditLimit: 60000, outstandingAmount: 0, status: "Active", joinDate: "2022-11-05" },
  { id: 5, name: "Mom's Sweets & Paneer", type: "Sweet Shop", phone: "9867890124", address: "Old Town, Near Temple", city: "Khandwa", contactPerson: "Neha Devi", creditLimit: 40000, outstandingAmount: 5000, status: "Active", joinDate: "2023-02-22" },
  { id: 6, name: "Health Care Hospital", type: "Hospital/Clinic", phone: "9678901235", address: "Medical Complex, New Road", city: "Mumbai", contactPerson: "Dr. Amit Kumar", creditLimit: 80000, outstandingAmount: 22000, status: "Inactive", joinDate: "2021-08-14" },
];

export const MILK_SALES = [
  { id: 1, clientId: 1, clientName: "Fresh Dairy Shop - City Center", date: "2025-01-15", product: "Pasteurized Milk (1L Packet)", quantity: 50, unit: "pcs", pricePerUnit: 85, total: 4250, paymentStatus: "Paid", reference: "INV001", notes: "Regular supply" },
  { id: 2, clientId: 2, clientName: "Jai Bhim Milk Cooperative", date: "2025-01-15", product: "Fresh Cow Milk", quantity: 200, unit: "L", pricePerUnit: 55, total: 11000, paymentStatus: "Paid", reference: "INV002", notes: "Bulk supply" },
  { id: 3, clientId: 3, clientName: "Hotel Grand Palace", date: "2025-01-15", product: "Paneer (500g)", quantity: 15, unit: "kg", pricePerUnit: 280, total: 4200, paymentStatus: "Pending", reference: "INV003", notes: "For food preparation" },
  { id: 4, clientId: 1, clientName: "Fresh Dairy Shop - City Center", date: "2025-01-14", product: "Butter (500g)", quantity: 8, unit: "kg", pricePerUnit: 450, total: 3600, paymentStatus: "Paid", reference: "INV004", notes: "" },
  { id: 5, clientId: 5, clientName: "Mom's Sweets & Paneer", date: "2025-01-14", product: "Curd (1kg)", quantity: 20, unit: "kg", pricePerUnit: 120, total: 2400, paymentStatus: "Paid", reference: "INV005", notes: "Regular supply" },
  { id: 6, clientId: 4, clientName: "Daily Needs Supermarket", date: "2025-01-14", product: "Milk Sachets (500ml)", quantity: 300, unit: "pcs", pricePerUnit: 5, total: 1500, paymentStatus: "Paid", reference: "INV006", notes: "" },
];

export const PRODUCTION_LOG = [
  { id: 1, date: "2025-01-15", process: "Pasteurization", inputQty: 500, inputUnit: "L", outputQty: 480, outputUnit: "L", lossPercent: 4, laborCost: 500, energyCost: 300, notes: "Standard batch" },
  { id: 2, date: "2025-01-15", process: "Paneer Making", inputQty: 200, inputUnit: "L", outputQty: 45, outputUnit: "kg", lossPercent: 8, laborCost: 800, energyCost: 400, notes: "Morning batch" },
  { id: 3, date: "2025-01-14", process: "Ghee Preparation", inputQty: 100, inputUnit: "kg", outputQty: 15, outputUnit: "kg", lossPercent: 15, laborCost: 600, energyCost: 350, notes: "Traditional method" },
  { id: 4, date: "2025-01-14", process: "Butter Churning", inputQty: 150, inputUnit: "L", outputQty: 22, outputUnit: "kg", lossPercent: 12, laborCost: 700, energyCost: 250, notes: "High quality butter" },
];

export const EXPENSE_PIE = [
  { name: "Transportation", value: 12500, color: "#3b82f6" },
  { name: "Storage", value: 8200, color: "#10b981" },
  { name: "Electricity", value: 4600, color: "#f59e0b" },
  { name: "Staff Salary", value: 35000, color: "#8b5cf6" },
  { name: "Maintenance", value: 2800, color: "#ef4444" },
];
