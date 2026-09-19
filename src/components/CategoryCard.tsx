import React from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  ArrowRightLeft, 
  FileArchive, 
  Edit3, 
  Shield, 
  Plus 
} from 'lucide-react';
import { ToolCategory } from '../types';
import { useApp } from '../context/AppContext';

interface CategoryCardProps {
  category: {
    id: ToolCategory;
    name: string;
    icon: string;
    colorClass: string;
    bgClass: string;
    borderClass: string;
  };
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  const { navigate, setActiveCategory } = useApp();

  const handleClick = () => {
    setActiveCategory(category.id);
    if (category.id === 'pdf') {
      navigate('/pdf-tools');
    } else if (category.id === 'image') {
      navigate('/image-tools');
    } else {
      navigate('/all-tools');
    }
  };

  const renderIconBadge = () => {
    switch (category.id) {
      case 'pdf':
        return (
          <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs shadow-sm border border-red-100 group-hover:scale-105 transition-transform">
            <div className="flex flex-col items-center">
              <FileText className="w-5 h-5 mb-0.5 text-red-500" />
              <span className="text-[8px] font-extrabold uppercase -mt-1 tracking-tighter">PDF</span>
            </div>
          </div>
        );
      case 'image':
        return (
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm border border-emerald-100 group-hover:scale-105 transition-transform">
            <ImageIcon className="w-6 h-6 text-emerald-500" />
          </div>
        );
      case 'convert':
        return (
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-sm border border-purple-100 group-hover:scale-105 transition-transform">
            <ArrowRightLeft className="w-5 h-5 text-purple-500" />
          </div>
        );
      case 'compress':
        return (
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm border border-blue-100 group-hover:scale-105 transition-transform">
            <FileArchive className="w-5 h-5 text-blue-500" />
          </div>
        );
      case 'edit':
        return (
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm border border-amber-100 group-hover:scale-105 transition-transform">
            <Edit3 className="w-5 h-5 text-amber-500" />
          </div>
        );
      case 'security':
        return (
          <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shadow-sm border border-teal-100 group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5 text-teal-500" />
          </div>
        );
      case 'create':
        return (
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm border border-indigo-100 group-hover:scale-105 transition-transform">
            <Plus className="w-5 h-5 text-indigo-500 stroke-[3]" />
          </div>
        );
      default:
        return (
          <div className="w-11 h-11 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        );
    }
  };

  return (
    <button
      onClick={handleClick}
      className="group flex flex-col items-center justify-center p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-md hover:shadow-blue-500/5 transition-all duration-200 text-center"
      id={`category-card-${category.id}`}
    >
      <div className="mb-3">
        {renderIconBadge()}
      </div>
      <span className="text-xs font-bold text-slate-800 tracking-wider group-hover:text-[#0066FF] transition-colors whitespace-nowrap">
        {category.name}
      </span>
    </button>
  );
};
