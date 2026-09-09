import {useEffect, useState} from "react";

import {addUserSkill, getSkills, getUserSkills, removeUserSkill} from "../api/skills";

import type {Skill}
from "../types/skill";

interface MySkillsProps {
    userId : number;
    onSkillsChanged : () => void; // for SkillGapStats to reload skill gaps
}

function MySkills({userId, onSkillsChanged} : MySkillsProps) {

    const [userSkills,
        setUserSkills] = useState < Skill[] > ([]);

    const [allSkills,
        setAllSkills] = useState < Skill[] > ([]);

    const [selectedSkillId,
        setSelectedSkillId] = useState < number | null > (null);

    const [loading,
        setLoading] = useState(true);

    async function loadSkills() {
        setLoading(true);

        try {
            const [userSkillData,
                allSkillData] = await Promise.all([getUserSkills(userId), getSkills()]);

            setUserSkills(userSkillData);
            setAllSkills(allSkillData);
        } catch {alert("Failed to load skills.");} finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadSkills();
    }, [userId]);

    async function handleAddSkill() {
        if (selectedSkillId === null) {
            return;
        }

        try {
            await addUserSkill(userId, selectedSkillId);

            await loadSkills();

            onSkillsChanged(); // notify SkillGapStats to reload skill gaps

            setSelectedSkillId(null);
        } catch {alert("Failed to add skill.");}
    }

    async function handleRemoveSkill(skillId : number) {
        try {
            await removeUserSkill(userId, skillId);

            await loadSkills();

            onSkillsChanged(); // for SkillGapStats to reload skill gaps
        } catch {alert("Failed to remove skill.");}
    }

    //从所有 skills 中，只保留用户目前没有的
    const availableSkills = allSkills.filter((skill) => !userSkills.some( // some() 方法用于检测数组中的元素是否满足指定条件（函数提供的测试)
            (userSkill) => userSkill.id === skill.id));

    if (loading) {
        return <p>Loading skills...</p>;
    }

    return (
        <section>
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                        My Skills
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Skills you currently have.
                    </p>
                </div>

                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
                    {userSkills.length} skills
                </span>
            </div>

            {userSkills.length === 0
                ? (
                    <p className="text-sm text-gray-500">
                        No skills added yet.
                    </p>
                )
                : (
                    <div className="flex flex-wrap gap-2">
                        {userSkills.map((skill) => (
                            <div
                                key={skill.id}
                                className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-sm text-blue-700">
                                <span>{skill.name}</span>

                                <button
                                    type="button"
                                    onClick={() => handleRemoveSkill(skill.id)}
                                    className="flex h-5 w-5 items-center justify-center rounded-full text-blue-500 transition-colors hover:bg-blue-100 hover:text-blue-800"
                                    aria-label={`Remove ${skill.name}`}>
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}

            <div className="mt-5 flex gap-2">
                <select
                    value={selectedSkillId ?? ""}
                    onChange={(event) => setSelectedSkillId(event.target.value === ""
                    ? null
                    : Number(event.target.value))}
                    className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                    <option value="">
                        Select a skill
                    </option>

                    {availableSkills.map((skill) => (
                        <option key={skill.id} value={skill.id}>
                            {skill.name}
                        </option>
                    ))}
                </select>

                <button
                    type="button"
                    onClick={handleAddSkill}
                    disabled={selectedSkillId === null}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300">
                    Add
                </button>
            </div>
        </section>
    );
}

export default MySkills;