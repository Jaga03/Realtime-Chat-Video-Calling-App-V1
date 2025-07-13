import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../Store/useAuthStore';
import ChatzUpLogo from './ChatzupLogo';
import { LogOut, Settings, User } from 'lucide-react';


const Navbar = () => {
  const { logout, authUser } = useAuthStore();

  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className='bg-base-100 border-b border-base-300 fixed w-full top-0 z-40 backdrop-blur-md shadow-md
  dark:shadow-lg'>
      <div className='container mx-auto px-4 h-16 flex items-center justify-between'>

        <Link to='/' className='flex items-center gap-2 hover:opacity-80 transition'>
          <ChatzUpLogo className="w-auto h-10" />
        </Link>

        <div className='flex items-center gap-3'>

          <Link to='/settings' className='btn btn-sm btn-outline text-base-content border-base-content'>
            <Settings className='size-5' />
            <span className='hidden sm:inline'>Settings</span>
          </Link>

          {authUser && (
            <>
              <Link to='/profile' className='btn btn-sm btn-outline text-base-content border-base-content'>
                <User className='size-5' />
                <span className='hidden sm:inline'>Profile</span>
              </Link>

              <button
                onClick={handleLogout}
                className='btn btn-sm btn-accent text-white gap-2'
              >
                <LogOut className='size-5' />
                <span className='hidden sm:inline'>Logout</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
