import { Link } from "react-router-dom";
import { Issue } from "@/types";
import { Badge } from "@/components/ui/badge";
import { statusOptions, priorityOptions, categoryOptions } from "@/data/mockData";
import { format } from "date-fns";
import { MapPin, Clock, ThumbsUp, ArrowUpRight, Calendar } from "lucide-react";
import React from 'react';

interface IssueCardProps {
  issue: Issue;
}

const IssueCard = ({ issue }: IssueCardProps) => {
  const statusOption = statusOptions.find(s => s.value === issue.status);
  const priorityOption = priorityOptions.find(p => p.value === issue.priority);
  const categoryOption = categoryOptions.find(c => c.value === issue.category);

  // Safely format date - handles both Date objects and string dates
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "Unknown date";
    try {
      return format(new Date(date), 'MMM d, yyyy');
    } catch (e) {
      return "Invalid date";
    }
  };

  const locationDisplay = typeof issue.location === 'string' 
    ? issue.location 
    : issue.location?.address || "Unknown location";

  // Get status-specific styles
  const getStatusStyles = (status: string) => {
    switch(status) {
      case 'reported':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'in-progress':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'resolved':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'closed':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // Get priority indicator color
  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-400';
      case 'low':
        return 'bg-blue-400';
      default:
        return 'bg-gray-400';
    }
  };

  // Get category icon background
  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'roads':
        return 'bg-orange-100 text-orange-600';
      case 'water':
        return 'bg-blue-100 text-blue-600';
      case 'electricity':
        return 'bg-yellow-100 text-yellow-600';
      case 'sanitation':
        return 'bg-green-100 text-green-600';
      case 'public-spaces':
        return 'bg-purple-100 text-purple-600';
      case 'transportation':
        return 'bg-indigo-100 text-indigo-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <Link to={`/issues/${issue.id}`} className="group block">
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#FF7722]/20">
        {/* Image Section */}
        <div className="relative aspect-video bg-gray-100 overflow-hidden">
          {issue.images && issue.images.length > 0 ? (
            <img 
              src={issue.images[0]} 
              alt={issue.title} 
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              <span className="text-gray-400 text-sm">No image available</span>
            </div>
          )}
          
          {/* Priority Indicator */}
          <div className={`absolute top-3 left-3 w-3 h-3 rounded-full ${getPriorityColor(issue.priority)} ${issue.priority === 'urgent' ? 'animate-pulse' : ''} ring-2 ring-white shadow-sm`} 
               title={`${priorityOption?.label || issue.priority} priority`} />
          
          {/* Status Badge */}
          {statusOption && (
            <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyles(issue.status)} backdrop-blur-sm`}>
              {statusOption.label}
            </div>
          )}
          
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* View Details Arrow */}
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
              <ArrowUpRight className="h-4 w-4 text-[#FF7722]" />
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-3 md:p-4">
          {/* Title */}
          <h3 className="text-base md:text-lg font-semibold text-gray-900 line-clamp-1 group-hover:text-[#FF7722] transition-colors duration-200">
            {issue.title}
          </h3>

          {/* Location */}
          <div className="mt-1.5 md:mt-2 flex items-center text-xs md:text-sm text-gray-500">
            <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-1.5 text-[#FF7722] flex-shrink-0" />
            <span className="truncate">{locationDisplay}</span>
          </div>
          
          {/* Date */}
          <div className="mt-1 md:mt-1.5 flex items-center text-xs md:text-sm text-gray-400">
            <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-1.5 flex-shrink-0" />
            <span>{formatDate(issue.reportedAt)}</span>
          </div>

          {/* Description */}
          <p className="mt-2 md:mt-3 text-gray-600 text-xs md:text-sm line-clamp-2 leading-relaxed">
            {issue.description}
          </p>
          
          {/* Tags */}
          <div className="mt-3 md:mt-4 flex flex-wrap gap-1.5 md:gap-2">
            {categoryOption && (
              <span className={`px-2 py-0.5 md:px-2.5 md:py-1 rounded-md text-xs font-medium ${getCategoryColor(issue.category)}`}>
                {categoryOption.label}
              </span>
            )}
          </div>

          {/* Footer */}
          <div className="mt-3 md:mt-4 pt-2 md:pt-3 border-t border-gray-100 flex justify-between items-center">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="h-3 w-3 md:h-3.5 md:w-3.5" />
              <span className="hidden xs:inline">{issue.duration}</span>
            </span>
            {issue.upvotes !== undefined && (
              <div className="flex items-center gap-1 md:gap-1.5 text-gray-500 bg-gray-50 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full">
                <ThumbsUp className="h-3 w-3 md:h-3.5 md:w-3.5" />
                <span className="text-xs font-medium">{issue.upvotes}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default IssueCard;
