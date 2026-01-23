// Utilitários compartilhados para vídeos (Dashboard e VideoPlayerDedicated)

// Extrair ID do YouTube de uma URL
export const getYouTubeVideoId = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return match[2];
  }
  return null;
};

// Durações conhecidas dos vídeos (mesma fonte para Dashboard e VideoPlayerDedicated)
export const getVideoDuration = (videoUrl) => {
  if (!videoUrl) return "6 min";
  
  const videoId = getYouTubeVideoId(videoUrl);
  
  const durations = {
    // PROJETO VERÃO
    'nNw3I_x5VfA': '32:15',
    'dguwzqWv8J0': '28:45',
    'IwDC3yAnLvE': '35:20',
    '1_jzxLkuM_c': '30:10',
    'h_D85tk5Xtc': '33:55',
    'KmVOQI1eQJA': '29:30',
    'b36K_GtmarM': '31:40',
    'KFixxjv9aHA': '34:25',
    'hrlFlNBBxbs': '36:15',
    // COMEÇE POR AQUI
    'f7KNh2jRf5I': '15:30',
    // DESAFIO SUPER INTENSO
    'KuaeMLiUdpY': '40:00',
    'vxJppGl90cg': '32:00',
    'mQbxww1Pv40': '41:00',
    'DRLqOoxgtb0': '31:00',
    'yUgTVo_n95o': '50:00', // Treino 5
    'YTZe1vuwTdg': '32:00', // Treino 6
    // DESAFIO 4 SEMANAS
    'yFEy-61b_uA': '30:00',
    'mU4JTEgYFKs': '28:30',
    'xcKNaLGMjkk': '32:00',
    'HQZakZZpdC4': '29:45',
  };

  return durations[videoId] || "6 min";
};

// Calorias fixas por faixa de duração (sem cálculos dinâmicos)
export const getFixedCalories = (videoId) => {
  const fixedCalories = {
    // PROJETO VERÃO (30-40 min)
    'nNw3I_x5VfA': '300-500', // 32:15
    'dguwzqWv8J0': '300-500', // 28:45
    'IwDC3yAnLvE': '300-500', // 35:20
    '1_jzxLkuM_c': '300-500', // 30:10
    'h_D85tk5Xtc': '500-700', // 33:55
    'KmVOQI1eQJA': '300-500', // 29:30
    'b36K_GtmarM': '500-700', // 31:40
    'KFixxjv9aHA': '500-700', // 34:25
    'hrlFlNBBxbs': '500-700', // 36:15
    
    // COMEÇE POR AQUI (até 20 min)
    'f7KNh2jRf5I': '100-300', // 15:30
    
    // DESAFIO SUPER INTENSO - 6 treinos
    'KuaeMLiUdpY': '500-700', // 39 min - Treino 1
    'vxJppGl90cg': '500-700', // 31 min - Treino 2
    'mQbxww1Pv40': '700-900', // 41 min - Treino 3
    'DRLqOoxgtb0': '500-700', // 31 min - Treino 4
    'yUgTVo_n95o': '700-900', // 50 min - Treino 5
    'YTZe1vuwTdg': '500-700', // 31 min - Treino 6
    
    // DESAFIO 4 SEMANAS (20-30 min)
    'yFEy-61b_uA': '300-500', // 30:00
    'mU4JTEgYFKs': '300-500', // 28:30
    'xcKNaLGMjkk': '500-700', // 32:00
    'HQZakZZpdC4': '300-500', // 29:45
    
    // DESAFIO COM HALTERES (40+ min)
    'CNf4SwFMv_k': '700-900', // 42:30
    '5FtbUAPVmz8': '700-900', // 40:45
    '7d_DbJDs7Jc': '700-900', // 43:20
    '6U7lmtgLYEQ': '700-900', // 41:15
    'U5njK3mDmQQ': '700-900', // 44:10
    'Ow9ovYsQLeg': '700-900', // 42:55
    
    // PROJETO 60 DIAS - Semana 1 (30-40 min)
    'lu0eQYpmPXg': '500-700', // 32:45
    'MpEsci5ZsgM': '500-700', // 35:20
    'TVBFN2L9NC8': '500-700', // 33:15
    '-bS6kQuGD4w': '500-700', // 34:40
    'ZSVOYMWHRTg': '500-700', // 31:55
    'do3B9aIx1xg': '500-700', // 36:30
    
    // PROJETO 60 DIAS - Semana 2 (30-40 min)
    'tjCxKvnXMYM': '500-700', // 37:20
    'kfbPmV6CEOg': '500-700', // 35:45
    'Arc2Qkjvdqk': '500-700', // 38:10
    'CZjn2Dyaz-o': '500-700', // 36:25
    'AwLTstmWplk': '500-700', // 34:50
    '25ndeqHl2VY': '500-700', // 39:15
    
    // PROJETO 60 DIAS - Semana 3 (20-40 min)
    'meA-ztSLLPs': '700-900', // 40:30
    'V8ieuCVSZ4I': '500-700', // 38:45
    'fwNQ6uuCBhY-S3': '100-300', // 25:20 (Iniciantes)
    'Hj9-_ru7ETE-S3': '300-500', // 30:15 (Todo em pé)
    '52shuy0j3Ug-S3': '300-500', // 28:40 (Todo em pé)
    'fIJMbeTR_Ac': '700-900', // 41:25
    
    // PROJETO 60 DIAS - Semana 4 (40+ min)
    'k3OGwnIXfl4': '700-900', // 42:15
    'oxfCsEFqcJc': '500-700', // 39:50
    'xk6WVWmWqOE': '700-900', // 43:30
    'EjYf3ErSNiA': '700-900', // 40:45
    '2vGqtN-a4a8': '500-700', // 38:20
    'R33BAbCGCS0': '700-900', // 44:10
    
    // COM HALTERES - Semana 1 (40+ min)
    'UIpNzVEcJMM': '700-900', // 45:30
    'earb5ZwqR0I': '700-900', // 43:15
    'W3p4mSqTO6Y': '700-900', // 46:45
    'kX4TgtvAgaQ': '700-900', // 44:20
    'Q2q5B9P4uC0': '700-900', // 47:10
    '-TiBuBhSqK0': '700-900', // 45:55
    
    // COM HALTERES - Semana 2 (40+ min)
    'cnOC1hbmrNo': '700-900', // 48:25
    'XNc5qSqukDA': '700-900', // 46:40
    '7SIVCazsFFg': '700-900', // 49:15
    'TCQmx2NFnJQ': '700-900', // 47:30
    'T70k7fPMuEg': '700-900', // 45:50
    'd155zjKjU0w': '700-900', // 48:10
    
    // COM HALTERES - Semana 3 (40+ min)
    'KtgopE5JGH8': '700-900', // 50:20
    '85m_WquO514': '700-900', // 48:45
    '-OORG6pJT-M': '700-900', // 51:15
    '5KFAQEmtn5w': '700-900', // 49:30
    'SV4qvyLnKzY': '700-900', // 47:55
    'VhiKZ00gW0M': '700-900', // 50:40
    
    // COM HALTERES - Semana 4 (40+ min)
    'vekskTGfMFw': '700-900', // 52:15
    'AdgIL9o5rBw': '700-900', // 50:30
    '2m6rs_K_E4E': '700-900', // 53:45
    'Mfe1lGbarjo': '700-900', // 51:20
    'zOGK2YjEt9o': '700-900', // 49:55
    '2qhJBp6i_Fg': '700-900', // 52:40
    
    // VOCÊ ATLETA (50+ min)
    'avpuD9wGuEs': '700-900', // 55:30
    'NatMiFmYZyQ': '700-900', // 52:45
    '4RDlXN6StW8': '700-900', // 58:20
    'ZZQlhGQgB6Y': '700-900', // 54:15
    'd1HUSJ3rZ-w': '700-900', // 56:40
    '8oOaLCqC2pc': '700-900', // 53:25
    'vJ17HpRa95Y': '700-900', // 57:10
    'vi4dLgPz90g': '700-900', // 55:55
    'EjHDx036Jto': '700-900', // 59:30
    
    // FULL BODY (com halteres) - 32 treinos
    'SDb7kLcz9hs': '300-500', // 27 min - Treino 1
    'XbaFjArnK24': '300-500', // 22 min - Treino 2
    'TeOZT9wAHq4': '300-500', // 21 min - Treino 3
    '-XSkWJVRnzY': '300-500', // 23 min - Treino 4
    'Cdaoh6i6AIw': '300-500', // 29 min - Treino 5
    '1gsIqn9zgyg': '100-300', // 18 min - Treino 6
    'BE6fMnkG9vY': '700-900', // 46 min - Treino 7
    'Fw78EtZnhgU': '100-300', // 18 min - Treino 8
    '6PUm-LD7iGM': '100-300', // 18 min - Treino 9
    'N4da64kC5vs': '100-300', // 18 min - Treino 10
    'ibE9AK_RVhQ': '300-500', // 22 min - Treino 11
    'bb1IHzFrjzo': '100-300', // 20 min - Treino 12
    'ARuwvySaC6k': '300-500', // 22 min - Treino 13
    'DapUrU5trVE': '700-900', // 46 min - Treino 14
    'JdAD648Bi5s': '300-500', // 29 min - Treino 15
    'pc4jDn9vU9s': '300-500', // 21 min - Treino 16
    'R5Jc0uLFQDk': '300-500', // 26 min - Treino 17
    'UlEobtioU_c': '100-300', // 18 min - Treino 18
    'mAgveJ8clQE': '100-300', // 20 min - Treino 19
    'HD0jCFntjoI': '100-300', // 15 min - Treino 20
    'HWIC1wgFb_4': '100-300', // 20 min - Treino 21
    '_xXeiTEfv3E': '100-300', // 16 min - Treino 22
    'bSel8BYw-aE': '300-500', // 21 min - Treino 23
    'mwJHky6tMGE': '300-500', // 22 min - Treino 24
    'awfUG_87b1M': '300-500', // 23 min - Treino 25
    'vAKxMOwj7SQ': '300-500', // 26 min - Treino 26
    's9HCOnyovU4': '100-300', // 20 min - Treino 27
    '_suaIwTdo_w': '300-500', // 26 min - Treino 28
    'JPE2xBXt-Ww': '300-500', // 29 min - Treino 29
    'y8XZK4awTYY': '300-500', // 23 min - Treino 30
    'yU0mdgyrDeE': '500-700', // 32 min - Treino 31
    'W0pGWGvgbkk': '300-500', // 21 min - Treino 32
    
    // PERNAS & GLÚTEOS (Equipamentos) - 11 treinos
    'mODRly905jU': '100-300', // 17 min - Treino 1
    'jD5TIiqs6wY': '300-500', // 27 min - Treino 2
    'cwGJNzso5nI': '100-300', // 17 min - Treino 3
    'bWbeOq2uc30': '300-500', // 28 min - Treino 4
    'H02jIYqUyMg': '300-500', // 22 min - Treino 5
    'lW-M5uERtvY': '100-300', // 18 min - Treino 6
    'fH14W4bhbjw': '300-500', // 29 min - Treino 7
    '51IRcc8awu8': '300-500', // 24 min - Treino 8
    'xT11qd5qkKI': '300-500', // 25 min - Treino 9
    't177qXQ3_0o': '300-500', // 30 min - Treino 10
    'A1DGhVu_m7E': '300-500', // 27 min - Treino 11
    
    // TREINOS PARA SUPERIORES - 13 treinos
    'vuFEz7VsQ_I': '300-500', // 28 min - Treino 1
    'rvDigTmuqVs': '100-300', // 19 min - Treino 2
    '5Ca3miEvOjo': '100-300', // 18 min - Treino 3
    'EJjaCCo1zYY': '300-500', // 25 min - Treino 4
    'HMun_-BJrjg': '300-500', // 21 min - Treino 5
    '2K_jHsr9jkQ': '100-300', // 17 min - Treino 6
    'r57d1vi7Pho': '300-500', // 23 min - Treino 7
    'c75yHYXecVk': '100-300', // 20 min - Treino 8
    'qKTPp2-9rbc': '300-500', // 22 min - Treino 9
    'UW7gNCZWIFA': '100-300', // 14 min - Treino 10
    'UsLu9MvUMzA': '500-700', // 33 min - Treino 11
    'pAVqw8mpV3E': '500-700', // 33 min - Treino 12
    'ndsT0Zb8iEA': '100-300', // 13 min - Treino 13
    'c75yHYXecVk': '700-900', // 43:25
    'qKTPp2-9rbc': '700-900', // 41:50
    'UW7gNCZWIFA': '700-900', // 44:35
    
    // SEM IMPACTO (9 treinos)
    'HqzZKVRzZgA': '100-300', // 14 min - Treino 1
    'unXEPBc7ip4': '100-300', // 11 min - Treino 2
    'WAMQOJT8rcg': '100-300', // 16 min - Treino 3
    '5p1m_LSVkvY': '100-300', // 13 min - Treino 4
    'GGvTfOeoH8o': '100-300', // 19 min - Treino 5
    'FpT91KSEoSU': '100-300', // 10 min - Treino 6
    '3vD37XnDTM8': '300-500', // 30 min - Treino 7
    'mVo8MOjRjis': '100-300', // 17 min - Treino 8
    'DkMfYp0BZAU': '100-300', // 11 min - Treino 9
    
    // CARDIO DINÂMICO
    // 'og1-tjHx4gs' - Apresentação (não contabiliza)
    'K6aIR8Fh4Ds': '300-500', // 22 min - Treino 1
    'trWOAWL9y74': '300-500', // 24 min - Treino 2
    'Cy85t9BYY48': '100-300', // 10 min - Treino 3
    'O9PoOvcMiaw': '100-300', // 19 min - Treino 4
    '5UsS7jpyllc': '100-300', // 20 min - Treino 5
    'KIaDnSRcoC8': '100-300', // 19 min - Treino 6
    
    // TRINCAR ABS (14 treinos)
    '_GxV7VnIuPk': '100-300', // 10 min - Treino 1
    'DWD5zkYypyY': '100-300', // 9 min - Treino 2
    'OUcRa8lEbJ8': '100-300', // 15 min - Treino 3
    'L9KY4BeT4oo': '100-300', // 11 min - Treino 4
    'CEEeKS73EFk': '100-300', // 7 min - Treino 5
    'kmoqnrzrgeY': '100-300', // 11 min - Treino 6
    '5xRYb5L7XXw': '100-300', // 14 min - Treino 7
    'iVCM_EdJRC8': '100-300', // 12 min - Treino 8
    'ZycohTJ4I_8': '100-300', // 8 min - Treino 9
    'PsXnlxvjt1w': '100-300', // 14 min - Treino 10
    'DS4isgAOFWE': '100-300', // 12 min - Treino 11
    '49_IZNnEr3A': '100-300', // 13 min - Treino 12
    'UlkPtl81rHA': '100-300', // 13 min - Treino 13
    'vYmohnoaKJ0': '100-300', // 12 min - Treino 14
    
    // PERNAS E GLÚTEOS (Específico) - Treinos 2-11 (Treino 1 será adicionado)
    '7et3Y6yvVo4': '100-300', // 10 min - Treino 2
    'mEjdODrtol8': '100-300', // 20 min - Treino 3
    'EAKPqKW4w5k': '100-300', // 20 min - Treino 4
    'FmRx65DHqfI': '100-300', // 20 min - Treino 5
    'UQTbX3xjo4I': '300-500', // 21 min - Treino 6
    'X4mSk87lz_g': '100-300', // 7 min - Treino 7
    'G3Q7TcUZw0U': '100-300', // 15 min - Treino 8
    '6kx3exjh9is': '100-300', // 18 min - Treino 9
    'LLB6OcCDoW4': '300-500', // 23 min - Treino 10
    'cRJ8Lzgf_1s': '100-300', // 11 min - Treino 11
    
    // TREINOS COMBINADOS (31 treinos: 2-31)
    'FkNLIa2PuQc': '500-700', // 34 min - Treino 2
    'HkpK8m2KGFU': '300-500', // 28 min - Treino 3
    'vVp50AB8ijU': '500-700', // 38 min - Treino 4
    'c05X2ht1pYM': '300-500', // 29 min - Treino 5
    'VMZKQsYrv9M': '700-900', // 41 min - Treino 6
    'IjsOD3p-WMM': '700-900', // 46 min - Treino 7
    'vRW0TzpdWXQ': '700-900', // 44 min - Treino 8
    '3jLrmPTcKD0': '700-900', // 49 min - Treino 9
    'pq27cS-XdHs': '500-700', // 35 min - Treino 10
    'JXn9tvyRamw': '700-900', // 46 min - Treino 11
    'dIMNLgO97Do': '300-500', // 21 min - Treino 12
    'CttKJ3O6Wu0': '500-700', // 40 min - Treino 13
    'NOauhV0BEQ8': '700-900', // 42 min - Treino 14
    'EEskoSdUGOM': '500-700', // 39 min - Treino 15
    'vqQI6hEmA6g': '300-500', // 27 min - Treino 16
    '2ISj5-oUBeA': '700-900', // 41 min - Treino 17
    'pTYAMLNwpvw': '500-700', // 33 min - Treino 18
    'amj8MZrYXrM': '300-500', // 29 min - Treino 19
    '9UPriyVsmZ4': '500-700', // 38 min - Treino 20
    '_3f4D0BnELM': '700-900', // 46 min - Treino 21
    'WbT8dq61p4k': '300-500', // 30 min - Treino 22
    '2e-W9It4RR8': '700-900', // 44 min - Treino 23
    'cOgUWVEL0Es': '700-900', // 47 min - Treino 24
    'p7ZalnmSzM0': '500-700', // 33 min - Treino 25
    'kYv6_d8nt3M': '500-700', // 33 min - Treino 26
    'tI1GhIiiGKc': '500-700', // 35 min - Treino 27
    'N8FZBqOn1-4': '300-500', // 26 min - Treino 28
    '9QYeS7bUWVc': '500-700', // 34 min - Treino 29
    'V_LdNn2-Sr8': '500-700', // 40 min - Treino 30
    '8bpSY6sxmu4': '100-300', // 17 min - Treino 31
    
    // MÓDULO TODO EM PÉ (4 semanas - Treino 1 da Semana 1 será adicionado)
    'BXHdnW1eOFM': '100-300', // 20 min - Semana 1 - Treino 2
    'fRhosgsOMJs': '100-300', // 19 min - Semana 1 - Treino 3
    'bucIQZVSo4I': '300-500', // 26 min - Semana 1 - Treino 4
    '5PfDF04wdLc': '300-500', // 25 min - Semana 1 - Treino 5
    '6KIN3rnvi14': '100-300', // 20 min - Semana 1 - Treino 6
    'iJO5vQHu43Y': '300-500', // 30 min - Semana 2 - Treino 1
    '6zvg6sUrpsA': '300-500', // 30 min - Semana 2 - Treino 2
    '52shuy0j3Ug': '300-500', // 30 min - Semana 2 - Treino 3
    'Hj9-_ru7ETE': '300-500', // 30 min - Semana 2 - Treino 4
    '3LOkP7L-0gw': '100-300', // 20 min - Semana 2 - Treino 5
    '6SowpGPI1eI': '300-500', // 25 min - Semana 2 - Treino 6
    'D84fu-NYmLE': '100-300', // 11 min - Semana 3 - Treino 1
    'ugPWvvi1kFs': '500-700', // 35 min - Semana 3 - Treino 2
    '9bmtPMi0Bp8': '500-700', // 36 min - Semana 3 - Treino 3
    '6BTYTSYgumQ': '300-500', // 24 min - Semana 3 - Treino 4
    'e-dxRpuQ9Ag': '300-500', // 26 min - Semana 3 - Treino 5
    'Uo6zYdbFKcw': '300-500', // 29 min - Semana 3 - Treino 6
    '2AfvGmdNrhY': '700-900', // 41 min - Semana 4 - Treino 1
    'wjyT6gAAXdY': '100-300', // 17 min - Semana 4 - Treino 2
    'kZy_kSdArI4': '300-500', // 21 min - Semana 4 - Treino 3
    'cE3VtqUXl54': '300-500', // 26 min - Semana 4 - Treino 4
    'ZLYbEcbC61g': '300-500', // 30 min - Semana 4 - Treino 5
    'lMMtJTLEcbQ': '300-500', // 21 min - Semana 4 - Treino 6
    
    // PARA INICIANTES (4 semanas, 5 treinos cada)
    'nPUsedE4ZqU': '100-300', // 11 min - Semana 1 - Treino 1
    'fwNQ6uuCBhY': '100-300', // 20 min - Semana 1 - Treino 2
    'EbXLLB4koPY': '100-300', // 10 min - Semana 1 - Treino 3
    'RLm5c40E2Wg': '100-300', // 13 min - Semana 1 - Treino 4
    'BAdp1nGyJC8': '100-300', // 16 min - Semana 1 - Treino 5
    'HZf8uxAw5Hw': '100-300', // 18 min - Semana 2 - Treino 1
    'XqYZIfW1D94': '100-300', // 12 min - Semana 2 - Treino 2
    'wB0W4OmYnGU': '100-300', // 13 min - Semana 2 - Treino 3
    'ttlcLntZZ7k': '100-300', // 15 min - Semana 2 - Treino 4
    'cuPs8kWtlGQ': '100-300', // 15 min - Semana 2 - Treino 5
    'zN9Tkn5jPsM': '100-300', // 8 min - Semana 3 - Treino 1
    'uBuFPxIVXMY': '100-300', // 12 min - Semana 3 - Treino 2
    '52mAUiW0TSQ': '100-300', // 14 min - Semana 3 - Treino 3
    'o8T7Gdm4hPg': '100-300', // 15 min - Semana 3 - Treino 4
    '43J6yaGa3KE': '100-300', // 16 min - Semana 3 - Treino 5
    'XIyblCJx8Gw': '100-300', // 14 min - Semana 4 - Treino 1
    'BmDhahUDlew': '100-300', // 11 min - Semana 4 - Treino 2
    'SxW9QlBdlk0': '100-300', // 10 min - Semana 4 - Treino 3
    'wLbp-FoqJBk': '100-300', // 14 min - Semana 4 - Treino 4
    'P5UVeJm_sXo': '100-300', // 17 min - Semana 4 - Treino 5
  };
  
  return fixedCalories[videoId] || "300-500";
};

// Função de compatibilidade (mantém a interface existente)
export const calculateCaloriesRange = (duration) => {
  // Se receber uma URL, extrair o ID
  if (duration && (duration.includes('youtube.com') || duration.includes('youtu.be'))) {
    const videoId = getYouTubeVideoId(duration);
    return getFixedCalories(videoId);
  }
  
  // Se receber um ID direto
  if (duration && duration.length === 11 && !duration.includes(':')) {
    return getFixedCalories(duration);
  }
  
  // Fallback para duração padrão
  return "300-500";
};
