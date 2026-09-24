function Dashboard({ user, logout }) {
  const userName = user?.name || user?.user_name || 'User'

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="h-16 bg-white border-b flex items-center justify-between px-6">
        <h1 className="text-xl font-bold text-gray-900">My Dashboard</h1>

        <button
          onClick={logout}
          className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg transition"
        >
          Logout
        </button>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
          <h2 className="text-3xl font-bold text-gray-900">
            Welcome, {userName} 👋
          </h2>
          <p className="text-gray-500 mt-2">You are successfully logged in.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-xl font-bold mb-6">User Information</h2>

          <div className="space-y-4">
            <div className="flex justify-between border-b pb-4">
              <span className="text-gray-500">Name</span>
              <span className="font-medium">{userName}</span>
            </div>

            <div className="flex justify-between border-b pb-4">
              <span className="text-gray-500">Email</span>
              <span className="font-medium">{user?.email}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">User ID</span>
              <span className="font-medium">{user?.id || user?._id}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard