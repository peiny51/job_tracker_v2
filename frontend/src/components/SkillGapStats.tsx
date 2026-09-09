import {useEffect, useState} from "react";

import {getSkillGaps} from "../api/statistics";

import type {MissingSkill}
from "../types/statistics";

interface SkillGapStatsProps {
    userId : number;
    skillsVersion : number; // to trigger reload when skills change
}

function SkillGapStats({userId, skillsVersion} : SkillGapStatsProps) {

    const [missingSkills,
        setMissingSkills] = useState < MissingSkill[] > ([]);

    const [loading,
        setLoading] = useState(true);

    const [error,
        setError] = useState("");

    async function loadSkillGaps() {
        setLoading(true);
        setError("");

        try {
            const data = await getSkillGaps(userId);

            setMissingSkills(data.missingSkills);
        } catch {setError("Failed to load skill gap statistics.");} finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadSkillGaps();
    }, [userId, skillsVersion]); // reload when userId or skillsVersion changes

    if (loading) {
        return <p>Loading skill gaps...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    return (
        <section>
            <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                    Skills to Consider Learning
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                    Frequently requested skills missing from your current skill set.
                </p>
            </div>

            {missingSkills.length === 0
                ? (
                    <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
                        No missing skills found.
                    </div>
                )
                : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {missingSkills.map((skill) => (
                            <div
                                key={skill.skillId}
                                className="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-colors hover:bg-gray-100">
                                <div className="flex items-start justify-between gap-3">
                                    <span className="font-medium text-gray-800">
                                        {skill.name}
                                    </span>

                                    <span
                                        className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-600 shadow-sm">
                                        {skill.jobCount}
                                        {skill.jobCount === 1
                                            ? "job"
                                            : "jobs"}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
        </section>
    );
}

export default SkillGapStats;