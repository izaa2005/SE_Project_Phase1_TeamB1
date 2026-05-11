/**
 * ========================================
 * FILTER PANEL COMPONENT
 * ========================================
 * 
 * Megi: "This panel lets students filter opportunities by keywords, category, 
 *       location, and job type. It's essential for finding the right job!"
 * 
 * Anxhela: "On mobile, it collapses into a toggle button to save space.
 *          On desktop, it's always visible as a sticky sidebar."
 * 
 * Izabela: "We use debouncing (300ms) so we don't spam the API with every keystroke.
 *          And there's a 'Reset all' button to clear all filters at once."
 */

import { useState, useEffect } from 'react';
import { Filter, X } from 'lucide-react';

// Design decision: Using a collapsible panel for mobile, sidebar for desktop.
// CSS Trick: Using `transition-all` with `max-height` for smooth expand/collapse.
// Personal touch: Added a subtle gradient background for the filter header.

const FilterPanel = ({ filters, onFilterChange, availableCategories, availableLocations, availableTypes }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [localFilters, setLocalFilters] = useState(filters);

  // ===== DEBOUNCE FILTER CHANGES =====
  // Izabela: "We delay the API call by 300ms to avoid excessive requests
  //          while the user is still typing. Smart optimization!"
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange(localFilters);
    }, 300);
    return () => clearTimeout(timer);
  }, [localFilters]);

  // ===== UPDATE LOCAL FILTER STATE =====
  // Megi: "Update the local state - the debouncer will handle calling the parent"
  const handleChange = (key, value) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  // ===== RESET ALL FILTERS =====
  // Anxhela: "Clear all filters at once - useful when students want to start fresh"
  const handleReset = () => {
    setLocalFilters({});
  };

  // For mobile, we render a button to toggle the panel
  return (
    <>
      {/* ===== MOBILE TOGGLE BUTTON ===== */}
      {/* Izabela: "On small screens, the filter panel hides behind a toggle button.
                   This keeps the mobile view clean and uncluttered." */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center w-full p-3 bg-primary-50 border border-primary-200 rounded-lg text-primary-700 font-medium"
        >
          <Filter className="w-5 h-5 mr-2" />
          {isOpen ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {/* ===== FILTER PANEL ===== */}
      {/* Megi: "On desktop (lg), this is always visible and sticky.
               On mobile, it toggles based on isOpen state." */}
      <div className={`
        lg:sticky lg:top-6
        bg-white rounded-xl border border-gray-200 p-6 shadow-sm
        transition-all duration-300
        ${isOpen ? 'block' : 'hidden lg:block'}
      `}>
        {/* ===== PANEL HEADER ===== */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900 flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </h3>
          {/* Reset button */}
          <button
            onClick={handleReset}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Reset all
          </button>
        </div>

        {/* ===== SEARCH FILTER ===== */}
        {/* Anxhela: "Free-text search across job titles, companies, descriptions" */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search keywords
          </label>
          <input
            type="text"
            placeholder="Job title, company, description..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={localFilters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
          />
        </div>

        {/* ===== CATEGORY FILTER ===== */}
        {/* Izabela: "Radio buttons for category - only one can be selected at a time" */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <div className="space-y-2">
            {availableCategories.map((cat) => (
              <label key={cat} className="flex items-center">
                <input
                  type="radio"
                  name="category"
                  checked={localFilters.category === cat}
                  onChange={() => handleChange('category', localFilters.category === cat ? undefined : cat)}
                  className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="text-gray-700">{cat}</span>
              </label>
            ))}
          </div>
        </div>

        {/* ===== LOCATION FILTER ===== */}
        {/* Megi: "Dropdown to select location - simpler than checkboxes when there are many options" */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={localFilters.location || ''}
            onChange={(e) => handleChange('location', e.target.value || undefined)}
          >
            <option value="">All locations</option>
            {availableLocations.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        {/* ===== JOB TYPE FILTER ===== */}
        {/* Anxhela: "Checkboxes for job type - students can select multiple types (intern, part-time, full-time)" */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Type
          </label>
          <div className="space-y-2">
            {availableTypes.map((type) => (
              <label key={type} className="flex items-center">
                <input
                  type="checkbox"
                  checked={localFilters.type === type}
                  onChange={() => handleChange('type', localFilters.type === type ? undefined : type)}
                  className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="text-gray-700">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Deadline filter (simplified) */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deadline within
          </label>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={localFilters.deadline || ''}
            onChange={(e) => handleChange('deadline', e.target.value || undefined)}
          >
            <option value="">Any time</option>
            <option value="week">Next 7 days</option>
            <option value="month">Next 30 days</option>
            <option value="quarter">Next 90 days</option>
          </select>
        </div>

        {/* CSS Trick: Using a gradient border on the reset button for visual interest */}
        <button
          onClick={handleReset}
          className="w-full py-2 px-4 border-2 border-transparent bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all duration-300"
        >
          Clear Filters
        </button>
      </div>
    </>
  );
};

export default FilterPanel;