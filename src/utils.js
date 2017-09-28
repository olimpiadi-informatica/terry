export function wait(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, ms);
  })
}

export function colorFromScore(score, max_score) {
  return score === max_score ? "success" : score === 0 ? "danger" : "warning";
}