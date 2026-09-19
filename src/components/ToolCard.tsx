import React from 'react';
import { 
  ArrowRight, 
  Layers, 
  Scissors, 
  FileArchive, 
  FileImage, 
  Images, 
  Image as ImageIcon, 
  FileText, 
  Trash2, 
  FileOutput, 
  RotateCw, 
  Type, 
  Hash, 
  Stamp, 
  Lock, 
  Unlock, 
  Minimize2, 
  Maximize2, 
  Crop, 
  FlipHorizontal, 
  ArrowRightLeft, 
  Globe, 
  FileCheck, 
  EyeOff, 
  Info, 
  UserSquare2, 
  Wand2,
  Scale
} from 'lucide-react';
import { ToolDefinition } from '../types';
import { useApp } from '../context/AppContext';

interface ToolCardProps {
  tool: ToolDefinition;
}

export const ToolIconRenderer: React.FC<{ name: string; className?: string; category?: string }> = ({ 
  name, 
  className = 'w-6 h-6',
  category
}) => {
  const iconProps = { className };

  switch (name) {
    case 'Scale': return <Scale {...iconProps} />;
    case 'Layers': return <Layers {...iconProps} />;
    case 'Scissors': return <Scissors {...iconProps} />;
    case 'FileArchive': return <FileArchive {...iconProps} />;
    case 'FileImage': return <FileImage {...iconProps} />;
    case 'Images': return <Images {...iconProps} />;
    case 'Image': return <ImageIcon {...iconProps} />;
    case 'FileText': return <FileText {...iconProps} />;
    case 'Trash2': return <Trash2 {...iconProps} />;
    case 'FileOutput': return <FileOutput {...iconProps} />;
    case 'RotateCw': return <RotateCw {...iconProps} />;
    case 'Type': return <Type {...iconProps} />;
    case 'Hash': return <Hash {...iconProps} />;
    case 'Stamp': return <Stamp {...iconProps} />;
    case 'Lock': return <Lock {...iconProps} />;
    case 'Unlock': return <Unlock {...iconProps} />;
    case 'Minimize2': return <Minimize2 {...iconProps} />;
    case 'Maximize2': return <Maximize2 {...iconProps} />;
    case 'Crop': return <Crop {...iconProps} />;
    case 'FlipHorizontal': return <FlipHorizontal {...iconProps} />;
    case 'ArrowRightLeft': return <ArrowRightLeft {...iconProps} />;
    case 'Globe': return <Globe {...iconProps} />;
    case 'FileCheck': return <FileCheck {...iconProps} />;
    case 'EyeOff': return <EyeOff {...iconProps} />;
    case 'Info': return <Info {...iconProps} />;
    case 'UserSquare2': return <UserSquare2 {...iconProps} />;
    case 'Wand2': return <Wand2 {...iconProps} />;
    default: return <FileText {...iconProps} />;
  }
};

export const ToolCard: React.FC<ToolCardProps> = ({ tool }) => {
  const { navigate } = useApp();

  // Color theme per tool category / type for the icon box
  const getIconStyle = () => {
    switch (tool.id) {
      case 'merge-pdf':
        return 'bg-red-500 text-white shadow-red-200';
      case 'compress-pdf':
        return 'bg-blue-500 text-white shadow-blue-200';
      case 'jpg-to-pdf':
        return 'bg-purple-600 text-white shadow-purple-200';
      case 'pdf-to-jpg':
        return 'bg-emerald-500 text-white shadow-emerald-200';
      case 'image-compressor':
      case 'compress-image':
        return 'bg-teal-500 text-white shadow-teal-200';
      case 'resize-image-to-kb':
        return 'bg-indigo-600 text-white shadow-indigo-200';
      case 'resize-image':
        return 'bg-amber-500 text-white shadow-amber-200';
      case 'png-to-jpg':
        return 'bg-rose-500 text-white shadow-rose-200';
      case 'image-to-pdf':
        return 'bg-blue-600 text-white shadow-blue-200';
      default:
        return tool.type === 'pdf' 
          ? 'bg-red-500 text-white shadow-red-100' 
          : 'bg-[#0066FF] text-white shadow-blue-100';
    }
  };

  return (
    <div
      onClick={() => navigate(`/${tool.slug}`)}
      className="group relative bg-white border border-slate-100 rounded-2xl p-5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
      id={`tool-card-${tool.id}`}
    >
      <div>
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${getIconStyle()} transition-transform group-hover:scale-105`}>
            <ToolIconRenderer name={tool.icon} className="w-6 h-6" />
          </div>

          {tool.badge && (
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-[#0066FF] border border-blue-100">
              {tool.badge}
            </span>
          )}
        </div>

        <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0066FF] transition-colors mb-1.5" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {tool.name}
        </h3>
        
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
          {tool.shortDescription}
        </p>
      </div>

      <div className="mt-4 pt-3 flex items-center justify-end border-t border-slate-50">
        <span className="text-slate-400 group-hover:text-[#0066FF] group-hover:translate-x-1 transition-all">
          <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </div>
  );
};
