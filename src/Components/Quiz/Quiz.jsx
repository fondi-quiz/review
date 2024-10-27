import React, { useState, useEffect, useRef } from 'react';
import './Quiz.css';
import { data as originalData } from '../../assets/data';
import logo from '../../assets/logo.png'; // Import the logo here


const Quiz = () => {
    const questionsPerBatch = 50;
    const [index, setIndex] = useState(0);
    const [question, setQuestion] = useState({});
    const [lock, setLock] = useState(false);
    const [score, setScore] = useState(0);
    const [totalPoints, setTotalPoints] = useState(0);
    const [maxPoints, setMaxPoints] = useState(0);
    const [result, setResult] = useState(false);
    const [lastAnswered, setLastAnswered] = useState(false);
    const [shuffledData, setShuffledData] = useState([]);
    const [startTime, setStartTime] = useState(null);
    const [totalTime, setTotalTime] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const optionRefs = useRef([]);
    const timerIntervalRef = useRef(null);

    // Group questions by Fondi
    const groupByFondi = (data) => {
        return data.reduce((acc, question) => {
            if (!acc[question.fondi]) acc[question.fondi] = [];
            acc[question.fondi].push(question);
            return acc;
        }, {});
    };

    const groupedData = groupByFondi(originalData);

    // Create batches of 50 questions for each Fondi
    const createBatches = (questions) => {
        const batches = [];
        for (let i = 0; i < questions.length; i += questionsPerBatch) {
            batches.push(questions.slice(i, i + questionsPerBatch));
        }
        return batches;
    };

    useEffect(() => {
        if (selectedBatch && selectedBatch.questions) {
            const selectedQuestions = selectedBatch.questions;
            setShuffledData(selectedQuestions);
            setQuestion(selectedQuestions[0]);
            const totalMaxPoints = selectedQuestions.reduce((acc, curr) => acc + parseInt(curr.pike), 0);
            setMaxPoints(totalMaxPoints);
            setStartTime(Date.now());
            timerIntervalRef.current = setInterval(() => {
                setElapsedTime(prevTime => prevTime + 1);
            }, 1000);
            return () => clearInterval(timerIntervalRef.current);
        }
    }, [selectedBatch]);

    useEffect(() => {
        if (result) {
            const endTime = Date.now();
            setTotalTime(Math.floor((endTime - startTime) / 1000));
            clearInterval(timerIntervalRef.current);
        }
    }, [result, startTime]);

    const checkAns = (e, ans) => {
        if (!lock) {
            if (question.ans === ans) {
                e.target.classList.add("correct");
                setScore(prev => prev + 1);
                setTotalPoints(prev => prev + parseInt(question.pike));
            } else {
                e.target.classList.add("wrong");
                optionRefs.current[question.ans - 1].classList.add("correct");
            }
            setLock(true);
            if (index === shuffledData.length - 1) {
                setLastAnswered(true);
            }
        }
    };

    const next = () => {
        if (lock) {
            if (lastAnswered) {
                setResult(true);
            } else {
                setIndex(prevIndex => {
                    const newIndex = prevIndex + 1;
                    setQuestion(shuffledData[newIndex]);
                    return newIndex;
                });
                setLock(false);
                optionRefs.current.forEach((ref) => {
                    if (ref) {
                        ref.classList.remove("wrong");
                        ref.classList.remove("correct");
                    }
                });
            }
        }
    };

    const reset = () => {
        setIndex(0);
        setQuestion(shuffledData[0]);
        setScore(0);
        setTotalPoints(0);
        setMaxPoints(shuffledData.reduce((acc, curr) => acc + parseInt(curr.pike), 0));
        setLock(false);
        setResult(false);
        setLastAnswered(false);
        setStartTime(Date.now());
        setElapsedTime(0);
        setTotalTime(0);
        timerIntervalRef.current = setInterval(() => {
            setElapsedTime(prevTime => prevTime + 1);
        }, 1000);
    };

    const formatTime = (timeInSeconds) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = timeInSeconds % 60;
        return `${minutes} minuta e ${seconds} sekonda`;
    };

    // Handle batch selection when a rectangle is clicked
    const handleBatchSelect = (questions) => {
        setSelectedBatch({ questions });
        setIndex(0);
        setResult(false);
        setScore(0);
        setTotalPoints(0);
        setMaxPoints(0);
        setElapsedTime(0);
        setTotalTime(0);
        clearInterval(timerIntervalRef.current);
    };

    return (
        <div className='container'>
            {/* Initial UI for Fondi-based batch selection */}
            {selectedBatch === null ? (
                <div className="batch-selection">
                    <h2>Përzgjidhni nje grupim pyetjesh:</h2>
                    {Object.keys(groupedData).map((fondi) => (
                        <div key={fondi} className="fondi-section">
                            <h3>Fondi {fondi}</h3>
                            <div className="batch-grid">
                                {createBatches(groupedData[fondi]).map((batch, idx) => (
                                    <div
                                        key={idx}
                                        className="batch-rectangle"
                                        onClick={() => handleBatchSelect(batch)}
                                    >
                                        {`${idx * questionsPerBatch + 1} - ${(idx + 1) * questionsPerBatch}`}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    {/* Quiz content */}
                    {!result && shuffledData.length > 0 && (
                        <div className="front-table">
                            <div className={`timer ${elapsedTime >= 600 ? 'red-text' : ''}`}>
                                <p>Koha: {formatTime(elapsedTime)}</p>
                            </div>
                            <p>Fondi: {question.fondi}</p>
                            <p>Nr: {question.no}</p>
                            <p>Pikë: {question.pike}</p>
                        </div>
                    )}

                    {result ? (
                        <>
                            <div className='back-table'>
                                <img src={logo} style={{ width: '10%', height: 'auto' }} alt="logo" /> {/* Reference the imported logo */}
                                <h1>Rezultatet</h1>
                                <p className='results'>Gjetur saktë: {score}/{shuffledData.length} Pyetje</p>
                                <p className='results'>Pikët e grumbulluara: {totalPoints} / {maxPoints}</p>
                                <p className='results'>Koha: {formatTime(totalTime)}</p>
                            </div>
                            <button onClick={reset}>Reset</button>
                        </>
                    ) : (
                        <>
                            <h2>{index + 1}. {question.question}</h2>
                            <ul>
                                {question.options?.map((option, idx) => (
                                    <li
                                        key={idx}
                                        ref={el => optionRefs.current[idx] = el}
                                        onClick={(e) => checkAns(e, idx + 1)}
                                    >
                                        {option}
                                    </li>
                                ))}
                            </ul>
                            <button onClick={next}>Next</button>
                            <div className='index'><h3>{index + 1}/{shuffledData.length} Pyetje</h3></div>
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default Quiz;
