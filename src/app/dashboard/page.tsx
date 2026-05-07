export default function Page() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            
            <div className="text-3xl font-bold text-indigo-600">
              Sahan Research
            </div>

            <nav className="hidden md:flex gap-6">
              <a href="#" className="text-black">Home</a>
              <a href="#" className="text-black">About</a>
              <a href="#" className="text-black">Courses</a>
              <a href="#" className="text-black">Contact</a>
            </nav>

            <button className="md:hidden text-3xl">
              ☰
            </button>

          </div>
        </div>
      </header>
    </div>
  );
}