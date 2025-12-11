'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import AgentForm from '@/components/AgentForm';
import Image from 'next/image';

export default function AgentsPage() {
  const [agents, setAgents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents');
      const data = await response.json();
      setAgents(data);
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (formData) => {
    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setShowForm(false);
        fetchAgents();
      } else {
        alert('Failed to create agent');
      }
    } catch (error) {
      console.error('Error creating agent:', error);
      alert('An error occurred');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;

    try {
      const response = await fetch(`/api/agents/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchAgents();
      } else {
        alert('Failed to delete agent');
      }
    } catch (error) {
      console.error('Error deleting agent:', error);
      alert('An error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Agents Management</h1>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {showForm ? 'Cancel' : 'Add Agent'}
            </button>
          </div>

          {showForm && (
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h2 className="text-xl font-semibold mb-4">Create New Agent</h2>
              <AgentForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {agents.map((agent) => (
                <div key={agent.id} className="bg-white rounded-lg shadow overflow-hidden">
                  {agent.photoUrl && (
                    <div className="h-48 w-full relative">
                      <Image
                        src={agent.photoUrl}
                        alt={agent.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{agent.email}</p>
                    <p className="text-sm text-gray-500">{agent.phoneNumber}</p>
                    <p className="text-sm text-gray-500 mt-2">{agent.address}</p>
                    <button
                      onClick={() => handleDelete(agent.id)}
                      className="mt-4 px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {agents.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No agents found
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


