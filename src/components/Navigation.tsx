import { Link } from 'react-router-dom';

function Navigation() {
  return (
    <nav className="bg-primary shadow-md sticky top-0 z-[100]">
      <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
        <Link
          to="/"
          className="text-2xl font-bold text-white no-underline transition-opacity duration-200 hover:opacity-90"
        >
          GIST Physics Simulator
        </Link>
        <div className="text-white text-sm opacity-90">
          Generative Interactive Simulations for Teaching
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
