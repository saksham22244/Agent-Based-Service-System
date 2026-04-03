'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaBell, FaUserCircle, FaSearch, FaTimes, FaCamera } from 'react-icons/fa';
import { toast } from 'react-toastify';

export default function TopHeader({ user, setUser, noticesCount = 0, hideSearch = false }) {
  const router = useRouter();
  const [showProfile, setShowProfile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    address: user?.address || '',
  });

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleBellClick = () => {
    if (user?.role === 'agent') {
      router.push('/agent/notices');
    } else {
      router.push('/user/notices');
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const endpoint = user.role === 'agent' ? `/api/agents/${user.id}` : `/api/users/${user.id}`;
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!res.ok) throw new Error('Failed to update profile');
      const updatedData = await res.json();
      
      const updatedUser = { ...user, ...updatedData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser)); // Persist locally!
      
      toast.success('Profile updated successfully!');
      setShowProfile(false);
    } catch (err) {
      toast.error('Error updating profile');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast.error('Image must be less than 2MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setProfileData(prev => ({ ...prev, profilePicture: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <div className="flex items-center gap-6">
        <div 
          onClick={handleBellClick}
          className="relative cursor-pointer hover:text-[#2da18d] transition-colors text-[#3DBDA7] p-2 hover:bg-teal-50 rounded-full"
          title="View Notices"
        >
           <FaBell size={24} />
           {noticesCount > 0 && (
             <span className="absolute top-1 right-1 bg-[#9B6DF7] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
               {noticesCount}
             </span>
           )}
        </div>

        <button 
          onClick={() => setShowProfile(true)}
          className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#3DBDA7] hover:bg-teal-50 transition-colors shadow-sm border border-teal-100 overflow-hidden"
        >
          {user?.profilePicture || profileData.profilePicture ? (
            <img src={user?.profilePicture || profileData.profilePicture} className="w-full h-full object-cover" alt="Profile" />
          ) : (
            <FaUserCircle size={28} />
          )}
        </button>
      </div>

      {showProfile && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <button 
              onClick={() => setShowProfile(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition p-2 bg-gray-50 rounded-full"
            >
              <FaTimes size={20} />
            </button>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">{user?.role === 'agent' ? 'Agent Profile' : 'User Profile'}</h2>
            
            <form onSubmit={handleProfileUpdate} className="space-y-5">
              <div className="flex justify-center mb-6 relative">
                 <div 
                   className="w-28 h-28 rounded-full bg-blue-50 border-4 border-white shadow-lg overflow-hidden relative group cursor-pointer"
                   onMouseEnter={() => setIsHovered(true)}
                   onMouseLeave={() => setIsHovered(false)}
                 >
                   {(profileData.profilePicture || user?.profilePicture) ? (
                     <img 
                       src={profileData.profilePicture || user?.profilePicture} 
                       className="w-full h-full object-cover"
                       alt="Profile"
                     />
                   ) : (
                     <FaUserCircle className="w-full h-full text-blue-200" />
                   )}
                   
                   <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                     <FaCamera className="text-white text-2xl" />
                   </div>

                   <input 
                     type="file"
                     accept="image/*"
                     onChange={handleImageUpload}
                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                   />
                 </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={profileData.name}
                  onChange={e => setProfileData({...profileData, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={profileData.email}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                <input 
                  type="text" 
                  value={profileData.phoneNumber}
                  onChange={e => setProfileData({...profileData, phoneNumber: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {user?.role === 'user' && ( // Usually only users have standard addresses, but let's just make it universal
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                  <input 
                    type="text" 
                    value={profileData.address || ''}
                    onChange={e => setProfileData({...profileData, address: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}

              <div className="pt-4 flex gap-4">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  type="button"
                  onClick={handleLogout}
                  className="flex-1 bg-red-50 text-red-600 font-bold py-3.5 rounded-xl hover:bg-red-100 transition border border-red-100"
                >
                  Logout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
