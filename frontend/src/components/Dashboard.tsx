'use client';

import { useState, useEffect } from 'react';
import { incidentAPI, Incident } from '@/lib/api';

export default function Dashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const response = await incidentAPI.getIncidents(false); // Only unresolved
      setIncidents(response.data);
      if (response.data.length > 0 && !selectedIncident) {
        setSelectedIncident(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (incidentId: number) => {
    try {
      // Optimistic update
      setIncidents(prev => prev.filter(inc => inc.id !== incidentId));
      
      await incidentAPI.resolveIncident(incidentId);
      
      // If resolved incident was selected, select next one
      if (selectedIncident?.id === incidentId) {
        const remaining = incidents.filter(inc => inc.id !== incidentId);
        setSelectedIncident(remaining.length > 0 ? remaining[0] : null);
      }
    } catch (error) {
      console.error('Error resolving incident:', error);
      // Revert optimistic update on error
      await fetchIncidents();
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Gun Threat': return 'bg-red-500';
      case 'Unauthorized Access': return 'bg-orange-500';
      case 'Suspicious Activity': return 'bg-yellow-500';
      case 'Loitering': return 'bg-blue-500';
      case 'Vehicle Alert': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Navbar */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                🔒 SecureSight CCTV Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {incidents.length} Active Incidents
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Section: Video Player */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h2 className="text-lg font-semibold mb-4">Incident Player</h2>
              
              {selectedIncident ? (
                <div className="space-y-4">
                  {/* Main Video/Image */}
                  <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center relative">
                    <img
                      src={selectedIncident.thumbnailUrl}
                      alt="Incident footage"
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded">
                      🔴 LIVE
                    </div>
                  </div>

                  {/* Incident Details */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{selectedIncident.type}</h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        📍 {selectedIncident.camera.location}
                      </p>
                      <p className="text-sm text-gray-500">
                        🕒 {formatTime(selectedIncident.tsStart)} - {selectedIncident.tsEnd ? formatTime(selectedIncident.tsEnd) : 'Ongoing'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleResolve(selectedIncident.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      ✅ Resolve
                    </button>
                  </div>

                  {/* Camera Thumbnails */}
                  <div className="grid grid-cols-3 gap-2">
                    {incidents.slice(0, 3).map((incident) => (
                      <button
                        key={incident.id}
                        onClick={() => setSelectedIncident(incident)}
                        className={`aspect-video rounded border-2 transition-colors ${
                          selectedIncident.id === incident.id 
                            ? 'border-blue-500' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={incident.thumbnailUrl}
                          alt={incident.camera.name}
                          className="w-full h-full object-cover rounded"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">No active incidents</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Section: Incident List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <h2 className="text-lg font-semibold mb-4">Active Incidents</h2>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {incidents.map((incident) => (
                <div
                  key={incident.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedIncident?.id === incident.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedIncident(incident)}
                >
                  <div className="flex space-x-3">
                    <img
                      src={incident.thumbnailUrl}
                      alt="Incident"
                      className="w-16 h-12 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`px-2 py-1 text-xs text-white rounded ${getTypeColor(incident.type)}`}>
                          {incident.type}
                        </span>
                      </div>
                      <p className="text-sm font-medium truncate">
                        {incident.camera.location}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTime(incident.tsStart)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResolve(incident.id);
                      }}
                      className="text-xs text-green-600 hover:text-green-800"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {incidents.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                🎉 No active incidents
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}