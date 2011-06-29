db.raw.update({"m_m":1}, {$set: {"m_m": 0}}, false, true)
db.raw.update({"m_h":1}, {$set: {"m_h": 0}}, false, true)
db.medium.remove();
db.longterm.remove();
db.mr_min_a_b.drop();
db.mr_min_p_q.drop();
db.mr_hr_a_b.drop();
db.mr_hr_p_q.drop();
