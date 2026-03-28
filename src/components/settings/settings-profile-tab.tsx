"use client";

const profile = {
  employeeId: "ZN-00393022",
  name: "Shakur Walsu",
  email: "Shakur.wasiu@zenaex.com",
  phoneNumber: "08077657678",
  department: "Technology",
  role: "Operations",
  dateJoined: "Jan 6, 2025 | 9:32AM",
};

export function SettingsProfileTab() {
  return (
    <div>
      {/* Profile table */}
      <div className="overflow-x-auto rounded-xl border border-[#E8EBEE] bg-white">
        <table className="w-full min-w-200 border-collapse text-left text-sm">
          <thead>
            <tr className="text-zinc-500 bg-[#F9FAFB]">
              <th className="border-b border-[#E8EBEE] px-4 py-3 font-medium">Employee ID</th>
              <th className="border-b border-[#E8EBEE] px-4 py-3 font-medium">Name</th>
              <th className="border-b border-[#E8EBEE] px-4 py-3 font-medium">Email Address</th>
              <th className="border-b border-[#E8EBEE] px-4 py-3 font-medium">Phone Number</th>
              <th className="border-b border-[#E8EBEE] px-4 py-3 font-medium">Department</th>
              <th className="border-b border-[#E8EBEE] px-4 py-3 font-medium">Role</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-5 font-medium border-r border-[#E8EBEE] text-black underline underline-offset-2">
                {profile.employeeId}
              </td>
              <td className="px-4 py-5 border-r border-[#E8EBEE] text-primary-text">{profile.name}</td>
              <td className="px-4 py-5 border-r border-[#E8EBEE] text-zinc-500">{profile.email}</td>
              <td className="px-4 py-5 border-r border-[#E8EBEE] text-zinc-500">{profile.phoneNumber}</td>
              <td className="px-4 py-5 border-r border-[#E8EBEE] text-zinc-500">{profile.department}</td>
              <td className="px-4 py-5 border-r border-[#E8EBEE] text-zinc-500">{profile.role}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Date Joined */}
     
    <div className="mt-4 border rounded-xl border-[#E8EBEE] py-4 bg-[#F9FAFB]">
      <div>
        <p className="px-4 mb-2 text-sm font-medium text-zinc-500">Date Joined</p>
      </div>
      <div className="bg-white h-16 rounded-b-xl"> 
        <hr className="my-2 border-t border-[#E8EBEE] w-full" />
        <p className="px-4 text-sm text-primary-text h-10">{profile.dateJoined}</p>
      </div>
    </div>
    </div>
  );
}
