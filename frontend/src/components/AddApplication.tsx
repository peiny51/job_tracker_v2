import {useState} from "react";

import {createJob, analyzeJobPost} from "../api/jobs";

interface AddApplicationProps {
    userId : number;
    onClose : () => void;
    onCreated : () => void;
}

function AddApplication({userId, onClose, onCreated} : AddApplicationProps) {

    const [company,
        setCompany] = useState("");
    const [jobTitle,
        setJobTitle] = useState("");
    const [jobUrl,
        setJobUrl] = useState("");
    const [status,
        setStatus] = useState("Watched");
    const [rawSkillTags,
        setRawSkillTags] = useState("");
    const [rawJobDescription,
        setRawJobDescription] = useState("");

    const [saving,
        setSaving] = useState(false);
    const [error,
        setError] = useState("");

    const [location,
        setLocation] = useState("");

    // 当前是不是正在等 Gemini
    const [analyzing,
        setAnalyzing] = useState(false);

    const [detectedSkills,
        setDetectedSkills] = useState < string[] > ([]);

    async function handleSubmit(event : React.FormEvent < HTMLFormElement >) {
        event.preventDefault();

        setSaving(true);
        setError("");

        try {
            await createJob({
                userId,
                company,
                jobTitle,
                jobUrl: jobUrl.trim()
                    ? jobUrl
                    : null,
                rawSkillTags,
                rawJobDescription,
                status
            });

            onCreated();
            onClose();
        } catch {setError("Failed to create application.");} finally {
            setSaving(false);
        }
    }

    async function handleAnalyze() {
        if (!rawJobDescription.trim()) {
            setError("Please paste a job description first.");

            return;
        }

        setAnalyzing(true);
        setError("");

        try {
            const result = await analyzeJobPost(rawJobDescription);

            setCompany(result.company ?? "");

            setJobTitle(result.jobTitle ?? "");

            setLocation(result.location ?? "");

            setJobUrl(result.jobUrl ?? "");

            setDetectedSkills(result.skills);

            setRawSkillTags(result.skills.join("\n"));
        } catch {setError("Failed to analyze job post.");} finally {
            setAnalyzing(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

            <div
                className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">

                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-2xl text-gray-500 hover:bg-gray-100"
                    aria-label="Close add application">
                    ×
                </button>

                <div className="pr-12">
                    <h2 className="text-2xl font-bold text-gray-900">
                        Add Application
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Add a job application manually.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-5">

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Company
                        </label>

                        <input
                            value={company}
                            onChange={(event) => setCompany(event.target.value)}
                            required
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"/>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Job Title
                        </label>

                        <input
                            value={jobTitle}
                            onChange={(event) => setJobTitle(event.target.value)}
                            required
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"/>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Job URL
                        </label>

                        <input
                            type="url"
                            value={jobUrl}
                            onChange={(event) => setJobUrl(event.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"/>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Status
                        </label>

                        <select
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2">
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
                    </div>

                    <div>
                        <label>
                            Skills / Qualifications
                        </label>

                        <textarea
                            value={rawSkillTags}
                            onChange={(event) => setRawSkillTags(event.target.value)}
                            rows={5}
                            placeholder="Paste the skills or qualifications section from the job post..."/>

                        <p className="mt-1 text-xs text-gray-500">
                            Paste the skills or qualifications section as-is. The system will extract and
                            normalize skills.
                        </p>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Full Job Post
                        </label>

                        <textarea
                            value={rawJobDescription}
                            onChange={(event) => setRawJobDescription(event.target.value)}
                            rows={12}
                            placeholder="Paste the full job posting here..."
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"/>

                        <button
                            type="button"
                            onClick={handleAnalyze}
                            disabled={analyzing}
                            className="mt-3 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60">
                            {analyzing
                                ? "Analyzing..."
                                : "Analyze with AI"}
                        </button>

                        {detectedSkills.length > 0 && (
                            <div className="mt-5">
                                <h3 className="text-sm font-semibold text-gray-800">
                                    Detected Skills
                                </h3>

                                <div className="mt-2 flex flex-wrap gap-2">
                                    {detectedSkills.map((skill) => (
                                        <span
                                            key={skill}
                                            className="rounded-full bg-purple-50 px-3 py-1.5 text-sm text-purple-700">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {error && (
                        <p className="text-sm text-red-600">
                            {error}
                        </p>
                    )}

                    <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">

                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                            {saving
                                ? "Saving..."
                                : "Create Application"}
                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}

export default AddApplication;