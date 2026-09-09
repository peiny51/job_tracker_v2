import {useState} from "react";
import {updateJobStatus, deleteJob} from "../api/jobs";

import type {JobDetail as JobDetailType, JobMatch}
from "../types/job";

// 这个 component 需要父 component 传三个东西 只是为了验证传入数据是否符合这一的类型
interface JobDetailProps {
    job : JobDetailType;
    match : JobMatch | null;
    onClose : () => void;
    onStatusChanged : (jobId : number, newStatus : string) => void;
    onDeleted : () => void;
}

function JobDetail({job, match, onClose, onStatusChanged, onDeleted} : JobDetailProps) {

    const [status,
        setStatus] = useState(job.status);
    const [savingStatus,
        setSavingStatus] = useState(false);
    const [deleting,
        setDeleting] = useState(false);

    async function handleStatusChange(newStatus : string) {
        setSavingStatus(true);

        try {
            await updateJobStatus(job.id, newStatus);

            setStatus(newStatus);

            // 子组件 JobDetail 中调用父组件 App 传进来的函数，从而让父组件更新它自己的 state。
            onStatusChanged(job.id, newStatus);
        } catch {alert("Failed to update status.");} finally {
            setSavingStatus(false);
        }
    }

    async function handleDelete() {
        const confirmed = window.confirm(`Delete ${job.company} - ${job.jobTitle}?`);

        if (!confirmed) {
            return;
        }

        setDeleting(true);

        try {
            await deleteJob(job.id);

            onDeleted();  // 让父组件 App 知道这个 job 被删除了，从而让父组件更新它自己的 state。
            onClose();
        } catch {alert("Failed to delete application.");} finally {
            setDeleting(false);
        }
    }
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div
                className="relative max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">

                <button
                    className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-2xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                    onClick={onClose}
                    aria-label="Close job details">
                    ×
                </button>

                {/* Header */}
                <div className="pr-12">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {job.company}
                    </h2>

                    <h3 className="mt-1 text-lg text-gray-600">
                        {job.jobTitle}
                    </h3>
                </div>

                {/* Status */}
                <div className="mt-5 flex items-center gap-3">
                    <strong className="text-sm text-gray-700">
                        Status:
                    </strong>

                    <select
                        value={status}
                        disabled={savingStatus}
                        onChange={(event) => handleStatusChange(event.target.value)}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60">
                        <option value="Watched">
                            Watched
                        </option>

                        <option value="Applied">
                            Applied
                        </option>

                        <option value="Interview">
                            Interview
                        </option>

                        <option value="Rejected">
                            Rejected
                        </option>

                        <option value="Offer">
                            Offer
                        </option>
                    </select>

                    {savingStatus && (
                        <span className="text-sm text-gray-500">
                            Saving...
                        </span>
                    )}
                </div>

                {/* Required Skills */}
                <section className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Required Skills
                    </h3>

                    <div className="mt-3 flex flex-wrap gap-2">
                        {job
                            .skills
                            .map((skill) => (
                                <span
                                    key={skill.id}
                                    className="rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-700">
                                    {skill.name}
                                </span>
                            ))}
                    </div>
                </section>

                {/* Skill Match */}
                {match && (
                    <section className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">

                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Skill Match
                            </h3>

                            <span className="text-xl font-bold text-blue-600">
                                {match.matchPercentage}%
                            </span>
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-2">

                            {/* Matched */}
                            <div>
                                <p className="mb-2 text-sm font-medium text-green-700">
                                    Matched
                                </p>

                                <div className="flex flex-wrap gap-2">
                                    {match.matchedSkills.length === 0
                                        ? (
                                            <span className="text-sm text-gray-500">
                                                None
                                            </span>
                                        )
                                        : (match.matchedSkills.map((skill) => (
                                            <span
                                                key={skill}
                                                className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                                                {skill}
                                            </span>
                                        )))}
                                </div>
                            </div>

                            {/* Missing */}
                            <div>
                                <p className="mb-2 text-sm font-medium text-red-700">
                                    Missing
                                </p>

                                <div className="flex flex-wrap gap-2">
                                    {match.missingSkills.length === 0
                                        ? (
                                            <span className="text-sm text-gray-500">
                                                None
                                            </span>
                                        )
                                        : (match.missingSkills.map((skill) => (
                                            <span
                                                key={skill}
                                                className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                                                {skill}
                                            </span>
                                        )))}
                                </div>
                            </div>

                        </div>
                    </section>
                )}

                {/* Job Description */}
                <section className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Job Description
                    </h3>

                    <div
                        className="mt-3 whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-700">
                        {job.rawJobDescription}
                    </div>
                </section>

                {/* Original Job Link */}
                {job.jobUrl && (
                    <div className="mt-6">
                        <a
                            href={job.jobUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
                            Open original job post
                        </a>
                    </div>
                )}

            </div>

            <div className="mt-6 flex justify-between border-t border-gray-200 pt-4">

                <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60">
                    {deleting
                        ? "Deleting..."
                        : "Delete Application"}
                </button>

                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Close
                </button>

            </div>
        </div>

    );
}

export default JobDetail;