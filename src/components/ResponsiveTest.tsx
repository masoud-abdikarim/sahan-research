export function ResponsiveTest() {
  return (
    <div className="p-6 text-white text-center space-y-4">
      <div className="block md:hidden bg-red-500 rounded-lg py-8 font-bold">
        RED = MOBILE (&lt;768px)
      </div>

      <div className="hidden md:block lg:hidden bg-blue-500 rounded-lg py-8 font-bold">
        BLUE = TABLET (768–1023px)
      </div>

      <div className="hidden lg:block bg-green-500 rounded-lg py-8 font-bold">
        GREEN = DESKTOP (≥1024px)
      </div>
    </div>
  );
}

