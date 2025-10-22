import React from "react";
import "./QuizPage.scss";

const QuizPage = () => {
  return (
    <>
      <header
        id="header"
        className="fixed top-0 left-0 right-0 bg-white border-b border-neutral-200 z-50"
      >
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <i className="fa-solid fa-graduation-cap text-xl text-neutral-700"></i>
            <h1 className="text-lg text-neutral-900">
              JLPT N3 Mock Test - Reading Comprehension
            </h1>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-neutral-600">
              <i className="fa-regular fa-clock"></i>
              <span className="text-lg">28:45</span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-neutral-600">Progress:</span>
              <div className="w-32 h-2 bg-neutral-200 rounded-full">
                <div className="w-3/5 h-full bg-neutral-600 rounded-full"></div>
              </div>
              <span className="text-sm text-neutral-600">12/20</span>
            </div>

            <button className="px-4 py-2 bg-neutral-600 text-white rounded-lg hover:bg-neutral-700 transition-colors">
              <i className="fa-solid fa-paper-plane mr-2"></i>
              Submit Test
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" className="pt-20 min-h-screen bg-neutral-50">
        <div className="flex">
          <div id="quiz-content" className="flex-1 max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-neutral-500">
                    Question 12 of 20
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-neutral-100 text-neutral-800 text-xs rounded-full">
                      AI-generated quiz
                    </span>
                    <span className="px-2 py-1 bg-neutral-100 text-neutral-800 text-xs rounded-full">
                      Multiple Choice
                    </span>
                  </div>
                </div>

                <h2 className="text-xl text-neutral-900 mb-4">
                  次の文章を読んで、最も適切な答えを選んでください。
                </h2>

                <div className="bg-neutral-50 p-4 rounded-lg mb-6">
                  <p className="text-neutral-800 leading-relaxed">
                    日本の伝統的な建築は、自然との調和を重視している。木材を主な材料として使用し、
                    季節の変化に対応できるような設計になっている。また、地震が多い日本では、
                    建物の柔軟性も重要な要素となっている。
                  </p>
                </div>

                <p className="text-lg text-neutral-900 mb-6">
                  この文章によると、日本の伝統建築の特徴として正しいものはどれですか。
                </p>
              </div>

              <div className="space-y-3 mb-8">
                {["A", "B", "C", "D"].map((option, index) => (
                  <label
                    key={option}
                    className={`flex items-start space-x-3 p-4 border ${
                      option === "B"
                        ? "border-2 border-neutral-500 bg-neutral-50"
                        : "border-neutral-200 hover:bg-neutral-50"
                    } rounded-lg cursor-pointer`}
                  >
                    <input
                      type="radio"
                      name="answer"
                      value={option}
                      defaultChecked={option === "B"}
                      className="mt-1"
                    />
                    <div>
                      <span className="text-neutral-700">{option}.</span>
                      <span className="ml-2 text-neutral-800">
                        {[
                          "石材を主に使用している",
                          "自然環境に配慮した設計である",
                          "西洋建築の影響を受けている",
                          "装飾を重視した建築様式である",
                        ][index]}
                      </span>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <button className="flex items-center space-x-2 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors">
                  <i className="fa-solid fa-chevron-left"></i>
                  <span>Previous</span>
                </button>

                <button className="px-4 py-2 bg-neutral-100 text-neutral-800 rounded-lg hover:bg-neutral-200 transition-colors">
                  <i className="fa-solid fa-robot mr-2"></i>
                  AI Explanation
                </button>

                <button className="flex items-center space-x-2 px-4 py-2 bg-neutral-600 text-white rounded-lg hover:bg-neutral-700 transition-colors">
                  <span>Next</span>
                  <i className="fa-solid fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>

          <div id="sidebar" className="w-80 bg-white border-l border-neutral-200 p-6">
            <div className="mb-6">
              <h3 className="text-neutral-900 mb-4">Question Navigator</h3>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 20 }, (_, i) => (
                  <button
                    key={i + 1}
                    className={`w-10 h-10 rounded-lg text-sm ${
                      i + 1 === 12
                        ? "bg-neutral-600 text-white"
                        : "bg-neutral-100 text-neutral-800"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-neutral-900 mb-3">Legend</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-neutral-100 rounded"></div>
                  <span className="text-neutral-600">Answered</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-neutral-600 rounded"></div>
                  <span className="text-neutral-600">Current</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-neutral-100 rounded"></div>
                  <span className="text-neutral-600">Not answered</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-neutral-100 rounded"></div>
                  <span className="text-neutral-600">Marked for review</span>
                </div>
              </div>
            </div>

            <div className="border-t border-neutral-200 pt-4">
              <h4 className="text-neutral-900 mb-3">Test Summary</h4>
              <div className="space-y-2 text-sm text-neutral-600">
                <div className="flex justify-between">
                  <span>Answered:</span>
                  <span>11/20</span>
                </div>
                <div className="flex justify-between">
                  <span>Remaining:</span>
                  <span>9</span>
                </div>
                <div className="flex justify-between">
                  <span>Time left:</span>
                  <span className="text-neutral-600">28:45</span>
                </div>
              </div>

              <button className="w-full mt-4 px-4 py-2 bg-neutral-100 text-neutral-800 rounded-lg hover:bg-neutral-200 transition-colors">
                <i className="fa-solid fa-bookmark mr-2"></i>
                Mark for Review
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Submit Modal */}
      <div
        id="submit-modal"
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden"
      >
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <i className="fa-solid fa-exclamation-triangle text-4xl text-neutral-500 mb-4"></i>
            <h3 className="text-lg text-neutral-900 mb-2">
              Submit Test Confirmation
            </h3>
            <p className="text-neutral-600 mb-6">
              Are you sure you want to submit your test? You have 9 unanswered
              questions remaining.
            </p>

            <div className="flex space-x-3">
              <button className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors">
                Cancel
              </button>
              <button className="flex-1 px-4 py-2 bg-neutral-600 text-white rounded-lg hover:bg-neutral-700 transition-colors">
                Submit Test
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default QuizPage;
