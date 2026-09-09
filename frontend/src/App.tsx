import {useEffect, useState} from "react";
import {getJob, getJobMatch, getJobs} from "./api/jobs";

import type {JobDetail as JobDetailType, JobListItem, JobMatch}
from "./types/job";

import JobDetail from "./components/JobDetail";
import MySkills from "./components/MySkills";
import SkillGapStats from "./components/SkillGapStats";
import AddApplication from "./components/AddApplication";

import "./App.css";

function App() {
  const [jobs,
    setJobs] = useState < JobListItem[] > ([]);
  const [keyword,
    setKeyword] = useState("");
  const [page,
    setPage] = useState(1);
  const [totalPages,
    setTotalPages] = useState(1);
  const [totalCount,
    setTotalCount] = useState(0);
  const [loading,
    setLoading] = useState(false);
  const [error,
    setError] = useState("");
  const [selectedJob,
    setSelectedJob] = useState < JobDetailType | null > (null);

  const [selectedMatch,
    setSelectedMatch] = useState < JobMatch | null > (null);

  const [detailLoading,
    setDetailLoading] = useState(false);

  // 这个 state 用来触发 SkillGapStats 重新加载数据
  const [skillsVersion,
    setSkillsVersion] = useState(0);

  const [showAddApplication,
    setShowAddApplication] = useState(false);

  const pageSize = 10;

  async function loadJobs() {
    setLoading(true);
    setError("");

    try {
      const data = await getJobs(keyword, page, pageSize);

      setJobs(data.items);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } catch {setError("Failed to load jobs.");} finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
  }, [page]);

  async function openJob(id : number) {
    setDetailLoading(true);

    try {
      const [job,
        match] = await Promise.all([getJob(id), getJobMatch(id)]);

      setSelectedJob(job);
      setSelectedMatch(match);
    } catch {setError("Failed to load job details.");} finally {
      setDetailLoading(false);
    }
  }

  function closeJob() {
    setSelectedJob(null);
    setSelectedMatch(null);
  }

  function handleSearch() {
    setPage(1);
    loadJobs();
  }

  function handleStatusChanged(jobId : number, newStatus : string) {
    setJobs((currentJobs) => currentJobs.map((job) => job.id === jobId
      ? {
        ...job,
        status: newStatus
      }
      : job));

    setSelectedJob((currentJob) => currentJob
      ? {
        ...currentJob,
        status: newStatus
      }
      : null);
  }

  function handleSkillsChanged() {
    setSkillsVersion((version) => version + 1);
  }

  async function handleJobDeleted() {
    await loadJobs();

    setSkillsVersion((version) => version + 1);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-7xl px-6 py-8">

        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Job Tracker
          </h1>

          <p className="mt-2 text-gray-500">
            Track applications, skills, and skill gaps.
          </p>
        </header>

        <button
          onClick={() => setShowAddApplication(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          + Add Application
        </button>

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <MySkills userId={1} onSkillsChanged={handleSkillsChanged}/>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <SkillGapStats userId={1} skillsVersion={skillsVersion}/>
          </div>
        </div>

        <section
          className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

          <div className="border-b border-gray-200 p-6">
            <div
              className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Applications
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {totalCount}
                  applications
                </p>
              </div>

              <div className="flex w-full gap-2 md:w-auto">
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleSearch();
                  }
                }}
                  placeholder="Search jobs..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 md:w-80"/>

                <button
                  onClick={handleSearch}
                  className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700">
                  Search
                </button>
              </div>

            </div>
          </div>

          {loading && (
            <div className="p-6 text-gray-500">
              Loading...
            </div>
          )}

          {error && (
            <div className="p-6 text-red-600">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="w-full">

                <thead className="bg-gray-50">
                  <tr className="text-left text-sm text-gray-600">

                    <th className="px-6 py-3 font-medium">
                      Company
                    </th>

                    <th className="px-6 py-3 font-medium">
                      Position
                    </th>

                    <th className="px-6 py-3 font-medium">
                      Status
                    </th>

                    <th className="px-6 py-3 font-medium">
                      Preview
                    </th>

                    <th className="px-6 py-3 font-medium">
                      Date
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">

                  {jobs.map((job) => (
                    <tr
                      key={job.id}
                      onClick={() => openJob(job.id)}
                      className="cursor-pointer transition-colors hover:bg-gray-50">

                      <td className="px-6 py-4 font-medium text-gray-900">
                        {job.company}
                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        {job.jobTitle}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                          {job.status}
                        </span>
                      </td>

                      <td className="max-w-md px-6 py-4 text-sm text-gray-500">
                        {job.preview}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>
            </div>
          )}

          <div
            className="flex items-center justify-between border-t border-gray-200 px-6 py-4">

            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">
              Previous
            </button>

            <span className="text-sm text-gray-500">
              Page {page}
              of {totalPages}
            </span>

            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">
              Next
            </button>

          </div>

        </section>

        {selectedJob && (<JobDetail
          job={selectedJob}
          match={selectedMatch}
          onClose={closeJob}
          onStatusChanged={handleStatusChanged}
          onDeleted={handleJobDeleted}/>)}

        {showAddApplication && (<AddApplication
          userId={1}
          onClose={() => setShowAddApplication(false)}
          onCreated={loadJobs}/>)}
        {/* create new job后，重新加载jobs列表，app会使用onCreated回调来触发loadJobs() */}

      </main>
    </div>
  );
}

export default App;