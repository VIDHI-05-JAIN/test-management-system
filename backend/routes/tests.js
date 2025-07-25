const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ✅ Create Test (Save or Publish)
router.post('/', (req, res) => {
  const { title, questions, status } = req.body;

  if (!title || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ message: 'Title and questions are required.' });
  }

  const isPublished = status === 'published';

  const insertTest = `
    INSERT INTO tests (title, is_published)
    VALUES (?, ?)
  `;

  db.query(insertTest, [title, isPublished], (err, testResult) => {
    if (err) {
      console.error('Test insert error:', err);
      return res.status(500).json({ message: 'Failed to save test' });
    }

    const testId = testResult.insertId;

    const questionValues = questions.map((q) => [
      testId,
      q.question,
      q.options[0],
      q.options[1],
      q.options[2],
      q.options[3],
      q.correct,
      q.marks
    ]);

    const insertQuestions = `
      INSERT INTO questions 
      (test_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks)
      VALUES ?
    `;

    db.query(insertQuestions, [questionValues], (err2) => {
      if (err2) {
        console.error('Question insert error:', err2);
        return res.status(500).json({ message: 'Failed to save questions' });
      }

      return res.status(201).json({
        message: isPublished ? 'Test published successfully!' : 'Test saved as draft.'
      });
    });
  });
});

// ✅ Get All Tests with Pagination & Total Questions
// ✅ Get All Tests with attempt info
router.get('/', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 5;
  const offset = (page - 1) * limit;

  const countQuery = 'SELECT COUNT(*) AS total FROM tests';

  const dataQuery = `
  SELECT 
    t.id,
    t.title,
    t.is_published AS published,
    COUNT(q.id) AS total_questions,
    EXISTS (
      SELECT 1 FROM user_answers a WHERE a.test_id = t.id
    ) AS attempted,
    (
      SELECT COUNT(*) FROM user_answers ua 
      WHERE ua.test_id = t.id
    ) AS questions_answered
  FROM tests t
  LEFT JOIN questions q ON t.id = q.test_id
  GROUP BY t.id
  ORDER BY t.created_at DESC
  LIMIT ? OFFSET ?
`;

  db.query(countQuery, (err, countResult) => {
    if (err) {
      console.error('Count error:', err);
      return res.status(500).json({ message: 'Failed to count tests' });
    }

    const totalTests = countResult[0].total;
    const totalPages = Math.ceil(totalTests / limit);

    db.query(dataQuery, [limit, offset], (err2, results) =>{
      if (err2) {
        console.error('Fetch error:', err2);
        return res.status(500).json({ message: 'Failed to fetch tests' });
      }

      res.status(200).json({
        tests: results,
        totalPages
      });
    });
  });
});


// ✅ Delete a single question by ID
router.delete('/question/:id', (req, res) => {
  const questionId = req.params.id;

  db.query('DELETE FROM questions WHERE id = ?', [questionId], (err, result) => {
    if (err) {
      console.error('Delete question error:', err);
      return res.status(500).json({ message: 'Failed to delete question' });
    }

    res.status(200).json({ message: 'Question deleted successfully.' });
  });
});

// ✅ Get Published Tests — must be above `/:id`
router.get('/published', async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT t.id, t.title, COUNT(q.id) AS total_questions
      FROM tests t
      LEFT JOIN questions q ON t.id = q.test_id
      WHERE t.is_published = true
      GROUP BY t.id
    `);

    res.json(rows);
  } catch (err) {
    console.error('Error fetching published tests:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Get a single test and its questions by ID
router.get('/:id', (req, res) => {
  const testId = req.params.id;

  const testQuery = 'SELECT id, title, is_published FROM tests WHERE id = ?';
  const questionsQuery = `
    SELECT id, question_text, option_a, option_b, option_c, option_d, correct_option, marks
    FROM questions
    WHERE test_id = ?
  `;

  db.query(testQuery, [testId], (err, testResults) => {
    if (err || testResults.length === 0) {
      return res.status(404).json({ message: 'Test not found' });
    }

    const test = testResults[0];

    db.query(questionsQuery, [testId], (err2, questionResults) => {
      if (err2) {
        return res.status(500).json({ message: 'Failed to fetch questions' });
      }

      res.json({
        test,
        questions: questionResults
      });
    });
  });
});
// Check if any user has attempted this test
function hasTestBeenAttempted(testId, callback) {
  const query = `SELECT COUNT(*) AS count FROM user_answers WHERE test_id = ?`;
  db.query(query, [testId], (err, results) => {
    if (err) {
      console.error("Error checking test attempts:", err);
      return callback(err, null);
    }
    const attempted = results[0].count > 0;
    callback(null, attempted);
  });
}
// ✅ Edit a test by ID — with attempt check
router.put('/:id', (req, res) => {
  const testId = req.params.id;
  const { title, questions, status } = req.body;

  if (!title || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ message: 'Title and questions are required.' });
  }

  const isPublished = status === 'published';

  // 🔒 Block editing if already attempted
  hasTestBeenAttempted(testId, (err, attempted) => {
    if (err) {
      return res.status(500).json({ message: 'Error checking test attempts' });
    }

    if (attempted) {
      return res.status(403).json({ message: 'Test has been attempted and cannot be edited.' });
    }

    // ✅ Proceed to update
    const updateTest = `
      UPDATE tests SET title = ?, is_published = ? WHERE id = ?
    `;

    db.query(updateTest, [title, isPublished, testId], (err) => {
      if (err) {
        console.error('Test update error:', err);
        return res.status(500).json({ message: 'Failed to update test' });
      }

      const deleteQuestions = 'DELETE FROM questions WHERE test_id = ?';

      db.query(deleteQuestions, [testId], (err2) => {
        if (err2) {
          console.error('Failed to delete old questions:', err2);
          return res.status(500).json({ message: 'Failed to reset questions' });
        }

        const questionValues = questions.map((q) => [
          testId,
          q.question,
          q.options[0],
          q.options[1],
          q.options[2],
          q.options[3],
          q.correct,
          q.marks
        ]);

        const insertQuestions = `
          INSERT INTO questions 
          (test_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks)
          VALUES ?
        `;

        db.query(insertQuestions, [questionValues], (err3) => {
          if (err3) {
            console.error('Insert updated questions error:', err3);
            return res.status(500).json({ message: 'Failed to update questions' });
          }

          return res.status(200).json({
            message: isPublished ? 'Test updated and published!' : 'Test updated as draft.'
          });
        });
      });
    });
  });
});
// ✅ Get list of attempted test IDs for a user
// This should match your front-end fetch URL
router.get('/attempted/:userId', (req, res) => {
  const userId = req.params.userId;

  const query = `
    SELECT DISTINCT test_id
    FROM user_answers
    WHERE user_id = ?
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching attempted tests:', err);
      return res.status(500).json({ error: 'Server error' });
    }

    res.json(results); // Frontend maps `item.test_id`, so return raw array
  });
});

// ✅ Submit user answers (after taking test)
router.post('/answers/submit', async (req, res) => {
  const { answers } = req.body;

  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ message: 'No answers submitted' });
  }

  const testId = answers[0].test_id;
  const userId = answers[0].user_id;

  try {
    // 🔍 1. Check if user already submitted this test
    const [existing] = await db.promise().query(
      `SELECT COUNT(*) AS count FROM user_answers WHERE user_id = ? AND test_id = ?`,
      [userId, testId]
    );

    if (existing[0].count > 0) {
      return res.status(400).json({ message: 'Test already submitted.' });
    }

    // ✅ 2. Prepare values for insertion
    const values = answers.map(ans => [
      ans.user_id,
      ans.test_id,
      ans.question_id,
      ans.user_answer,
      ans.is_correct,
      ans.marks_obtained
    ]);

    // 📝 3. Insert answers into the database
    const query = `
      INSERT INTO user_answers 
      (user_id, test_id, question_id, user_answer, is_correct, marks_obtained)
      VALUES ?
    `;

    await db.promise().query(query, [values]);

    res.status(201).json({ message: 'Answers submitted successfully' });

  } catch (err) {
    console.error('Insert user answers error:', err);
    res.status(500).json({ message: 'Failed to save answers' });
  }
});


// ✅ Fetch answer summary: answered / total questions
router.get('/attempt-summary/:userId', (req, res) => {
  const userId = req.params.userId;

  const query = `
    SELECT 
      ua.test_id,
      COUNT(DISTINCT ua.question_id) AS answered,
      (
        SELECT COUNT(*) 
        FROM questions q 
        WHERE q.test_id = ua.test_id
      ) AS total_questions
    FROM user_answers ua
    WHERE ua.user_id = ?
    GROUP BY ua.test_id
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Summary fetch error:', err);
      return res.status(500).json({ message: 'Failed to fetch summary' });
    }

    res.json(results);
  });
});

// GET /api/tests/:testId/scores
router.get('/:testId/scores', async (req, res) => {
  const testId = req.params.testId;
  try {
    const [rows] = await db.promise().query(`
      SELECT 
        ua.user_id,
        u.mobile AS user_mobile,
        COUNT(*) AS total_answered,
        SUM(q.correct_option = ua.user_answer) AS correct_answers,
        SUM(ua.marks_obtained) AS marks_obtained,
        (
          SELECT SUM(marks)
          FROM questions
          WHERE test_id = ?
        ) AS total_marks
      FROM user_answers ua
      JOIN questions q ON ua.question_id = q.id
      JOIN users u ON ua.user_id = u.id
      WHERE ua.test_id = ?
      GROUP BY ua.user_id
    `, [testId, testId]);

    res.json(rows);
  } catch (err) {
    console.error('Error fetching scores:', err);
    res.status(500).json({ error: 'Failed to fetch scores' });
  }
});


router.get('/results/:userId/:testId', async (req, res) => {
  const { userId, testId } = req.params;

  try {
    const [rows] = await db.promise().query(`
      SELECT 
        COUNT(DISTINCT ua.question_id) AS total_answered,
        SUM(ua.is_correct) AS correct_answers,
        SUM(ua.marks_obtained) AS marks_obtained
      FROM user_answers ua
      WHERE ua.user_id = ? AND ua.test_id = ?
    `, [userId, testId]);

    const [totalQ] = await db.promise().query(`
      SELECT COUNT(*) AS total_questions FROM questions WHERE test_id = ?
    `, [testId]);

    res.json({
      total_questions: totalQ[0].total_questions,
      ...rows[0]
    });

  } catch (err) {
    console.error('Error fetching result summary:', err);
    res.status(500).json({ error: 'Failed to fetch result' });
  }
});

router.get('/test-header-check', (req, res) => {
  console.log('Received x-user-id:', req.headers['x-user-id']);
  res.json({ message: 'Header received!' });
});


module.exports = router;
