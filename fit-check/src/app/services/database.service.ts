import { Injectable } from '@angular/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection
} from '@capacitor-community/sqlite';

@Injectable({ providedIn: 'root' })
export class DatabaseService {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private isReady: Promise<void>;
  private readyResolver!: () => void;

  constructor() {
    // Cria a instância de conexão SQLite
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
    this.isReady = new Promise(resolve => {
      this.readyResolver = resolve;
    });
  }

  // Deleta o banco de dados
  async deleteDatabase(): Promise<void> {

    try {
      const dbName = 'fitcheckDB';

      // Cria conexão temporária se não existir
      const conn = this.sqlite.createConnection('fitcheckDB', false, 'no-encryption', 1, false)
      await this.closeDatabase();

      // Agora deleta o banco
      await this.sqlite.deleteOldDatabases();
      const result = await CapacitorSQLite.deleteDatabase({ database: 'fitcheckDB' });
      console.log('[DB] Banco de dados deletado:', result);
    } catch (err) {
      console.error('[DB] Erro ao deletar banco:', err);
    }
  }

  // Fecha a conexão com o banco.
  async closeDatabase(): Promise<void> {
    if (this.db) {
      await this.sqlite.closeConnection('appDB', false);
      this.db = null;
    }
  }

  // Inicializa o banco de dados, cria tabelas e popula com dados iniciais
  async initializeDatabase(): Promise<void> {
  console.log('[DB] Inicializando...');

  if ((window as any).Capacitor?.getPlatform?.() === 'web') {
    try {
      (CapacitorSQLite as any).wasmPath = "assets/wasm";
      await (CapacitorSQLite as any).initWebStore();
      console.log('[DB] initWebStore chamado com sucesso');
    } catch (err) {
      console.error('[DB] Erro no initWebStore:', err);
    }
  }

  try {
    let db: SQLiteDBConnection;

    try {
      const isConn = (await this.sqlite.isConnection('fitcheckDB', false)).result;
      if (isConn) {
        db = await this.sqlite.retrieveConnection('fitcheckDB', false);
      } else {
        db = await this.sqlite.createConnection('fitcheckDB', false, 'no-encryption', 1, false);
      }
    } catch {
    // Criar conexão
      db = await this.sqlite.createConnection('fitcheckDB', false, 'no-encryption', 1, false);
      console.log('[DB] catch...');
    }

    await db.open();
    this.db = db;
    console.log('[DB] Conexão aberta');

    await this.createTables();
    await this.populateExercicios();
    await this.populateTreinos();
    await this.populateHistorico();
    await this.populateTreinador();

    this.readyResolver();
  } catch (err) {
    console.error('[DB] Erro ao inicializar:', err);
  }
  }

  async ready(): Promise<void> {
    return this.isReady;
  }

  // Cria as tabelas
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('DB não aberto');
    // tabela de exercícios
    const createExercicios = `
        CREATE TABLE IF NOT EXISTS exercicios (
        id_exercicio INTEGER PRIMARY KEY AUTOINCREMENT,
        nome_exercicio TEXT NOT NULL,
        grupo_muscular TEXT 
        );
    `;

    
    const createTreinos = `
      CREATE TABLE IF NOT EXISTS treinos (
        id_treino INTEGER PRIMARY KEY AUTOINCREMENT,
        nome_treino TEXT NOT NULL,
        ativo INTEGER NOT NULL DEFAULT 1
      );
    `;

    const crateTreino_exercicios = ` 
      CREATE TABLE  IF NOT EXISTS treino_exercicios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        id_treino INTEGER NOT NULL,
        id_exercicio INTEGER NOT NULL,
        series_meta INTEGER,
        repeticao_meta INTEGER,
        carga_meta INTEGER,
        FOREIGN KEY (id_treino) REFERENCES treinos(id_treino) ON DELETE CASCADE,
        FOREIGN KEY (id_exercicio) REFERENCES exercicios(id_exercicio) ON DELETE CASCADE
      );
    `;

    const createHistorico = `
      CREATE TABLE IF NOT EXISTS historico (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        id_treino INTEGER NOT NULL,
        id_exercicio INTEGER NOT NULL,
        data TEXT NOT NULL,
        dia_semana TEXT NOT NULL,
        carga_feita INTEGER,
        repeticao_feita INTEGER,
        series_feito INTEGER,
        carga_meta INTEGER,
        repeticao_meta INTEGER,
        series_meta INTEGER,
        FOREIGN KEY (id_treino) REFERENCES treinos(id_treino),
        FOREIGN KEY (id_exercicio) REFERENCES exercicios(id_exercicio)
      );
    `;

    const createTreinador = `
      CREATE TABLE IF NOT EXISTS treinador (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        telefone TEXT,
        email TEXT,
        cidade TEXT,
        UF TEXT
      );
    `;

    await this.db.execute(createExercicios);
    await this.db.execute(createTreinos);
    await this.db.execute(crateTreino_exercicios);
    await this.db.execute(createHistorico);
    await this.db.execute(createTreinador);
    console.log('[DB] Tabelas criadas ou já existiam');
  }

  // Popula a tabela exercicios
  private async populateExercicios(): Promise<void> {
    if (!this.db) throw new Error('[DB] DB não aberto');

    const count = await this.db.query('SELECT COUNT(*) as total FROM exercicios');
    if (count.values && count.values[0].total > 0) {
      console.log('[DB] Tabela de exercícios já populada');
      return;
    }

    const exercicios = [
      { nome: 'Cadeira Extensora', grupo: 'Quadríceps' },
      { nome: 'Agachamento Livre', grupo: 'Posterior De Coxa' },
      { nome: 'Leg Press', grupo: 'Quadríceps' },
      { nome: 'Hack Machine', grupo: 'Quadríceps' },
      { nome: 'Mesa Flexora', grupo: 'Posterior De Coxa' },
      { nome: 'Bulgaro', grupo: 'Glúteos' },
      { nome: 'Remada Baixa', grupo: 'Dorsal' },
      { nome: 'Barra Fixa', grupo: 'Dorsal' },
      { nome: 'Serrote', grupo: 'Dorsal' },
      { nome: 'Remada Curvada', grupo: 'Trapézio Médio' },
      { nome: 'Puxada Neutra', grupo: 'Dorsal' },
      { nome: 'Elevacao Lateral', grupo: 'Deltoide Lateral' },
      { nome: 'Desenvolvimento', grupo: 'Deltoide Anterior' },
      { nome: 'Elevacao Frontal', grupo: 'Deltoide Anterior' },
      { nome: 'Crucifixo Inverso', grupo: 'Deltoide Posterior' },
      { nome: 'Cross Polia Baixa', grupo: 'Peitoral Inferior' },
      { nome: 'Supino', grupo: 'Peitoral Maior' },
      { nome: 'Supino H Inclinado', grupo: 'Peitoral Superior' },
      { nome: 'Push Up', grupo: 'Peitoral Maior' },
      { nome: 'Triceps Corda', grupo: 'Tríceps Braquial' },
      { nome: 'Triceps Testa', grupo: 'Tríceps Braquial' },
      { nome: 'Rosca Alternada', grupo: 'Bíceps Braquial' },
      { nome: 'Martelo', grupo: 'Braquiorradial' },
      { nome: 'Abdominal Máquina', grupo: 'Reto Abdominal' }
    ];

    for (const ex of exercicios) {
      await this.db.run(
        `INSERT INTO exercicios (nome_exercicio, grupo_muscular) VALUES (?, ?)`,
        [ex.nome, ex.grupo]
      );
    }

    console.log('[DB] Exercícios inseridos com sucesso:', exercicios.length);
  }

  // Popula a tabela treinos com alguns exemplos
  private async populateTreinos(): Promise<void> {
    if (!this.db) throw new Error('DB não aberto');

    const count = await this.db.query('SELECT COUNT(*) as total FROM treinos;');
    if (count.values && count.values[0].total > 0) {
      console.log('[DB] Tabela de treinos já populada');
      return; 
    }

    console.log('[DB] Inserindo treinos');

    //Inserir os treinos principais
    const treinos = ['Leg Day', 'Costas', 'Ombro', 'Peito', 'Braço'];
    for (const nome of treinos) {
      await this.db.run(`INSERT INTO treinos (nome_treino) VALUES (?)`, [nome]);
    }
    
    // Inserir os exercícios de cada treino
    const treinoExercicios = [
      // leg day
      { id_treino: 1, id_exercicio: 1, series: 2, repeticoes: 50, carga: 25 },
      { id_treino: 1, id_exercicio: 2, series: 5, repeticoes: 12, carga: 80 },
      { id_treino: 1, id_exercicio: 3, series: 4, repeticoes: 15, carga: 250 },
      { id_treino: 1, id_exercicio: 4, series: 5, repeticoes: 8, carga: 100 },
      { id_treino: 1, id_exercicio: 5, series: 4, repeticoes: 20, carga: 50 },
      { id_treino: 1, id_exercicio: 6, series: 4, repeticoes: 15, carga: 30 },

      // costas
      { id_treino: 2, id_exercicio: 7, series: 5, repeticoes: 10, carga: 50 },
      { id_treino: 2, id_exercicio: 8, series: 4, repeticoes: 8, carga: 0 },
      { id_treino: 2, id_exercicio: 9, series: 3, repeticoes: 10, carga: 40 },
      { id_treino: 2, id_exercicio: 10, series: 3, repeticoes: 10, carga: 80 },
      { id_treino: 2, id_exercicio: 11, series: 5, repeticoes: 10, carga: 60 },

      // ombro
      { id_treino: 3, id_exercicio: 12, series: 4, repeticoes: 10, carga: 15 },
      { id_treino: 3, id_exercicio: 13, series: 5, repeticoes: 10, carga: 20 },
      { id_treino: 3, id_exercicio: 14, series: 4, repeticoes: 15, carga: 25 },
      { id_treino: 3, id_exercicio: 15, series: 4, repeticoes: 20, carga: 80 },

      // peito
      { id_treino: 4, id_exercicio: 16, series: 5, repeticoes: 12, carga: 25 },
      { id_treino: 4, id_exercicio: 17, series: 5, repeticoes: 8, carga: 60 },
      { id_treino: 4, id_exercicio: 18, series: 5, repeticoes: 12, carga: 25 },
      { id_treino: 4, id_exercicio: 19, series: 4, repeticoes: 10, carga: 0 },

      // braço
      { id_treino: 5, id_exercicio: 20, series: 3, repeticoes: 12, carga: 30 },
      { id_treino: 5, id_exercicio: 22, series: 4, repeticoes: 8, carga: 17 },
      { id_treino: 5, id_exercicio: 21, series: 3, repeticoes: 10, carga: 25 },
      { id_treino: 5, id_exercicio: 23, series: 4, repeticoes: 12, carga: 12 },
      { id_treino: 5, id_exercicio: 24, series: 3, repeticoes: 12, carga: 10 }
    ];

    for (const te of treinoExercicios) {
      await this.db.run(
        `INSERT INTO treino_exercicios 
          (id_treino, id_exercicio, series_meta, repeticao_meta, carga_meta) 
        VALUES (?, ?, ?, ?, ?)`,
        [te.id_treino, te.id_exercicio, te.series, te.repeticoes, te.carga]
      );
    }
  }
  
  async populateHistorico() {
    console.log('[DB] Populando tabela historico...');

    try {
      const db = await this.sqlite.retrieveConnection('fitcheckDB', false);
      if (!db) throw new Error('Conexão com o banco não encontrada.');

      // Limpa o histórico antigo (evita duplicar durante os testes)
      await db.execute('DELETE FROM historico;');

      // Tabelas base
      const treinosRes = await db.query('SELECT id_treino FROM treinos;');
      const treinos = treinosRes.values || [];

      if (!treinos.length) {
        console.warn('[DB] Nenhum treino encontrado para gerar histórico.');
        return;
      }

      // Mapas de dias
      const nomesDias = [
        'segunda-feira',
        'terça-feira',
        'quarta-feira',
        'quinta-feira',
        'sexta-feira',
        'sábado',
        'domingo'
      ];
      const hoje = new Date();

      const getDateForWeekday = (base: Date, weekdayIndex: number, weeksAgo: number): Date => {
        const d = new Date(base);
        const current = d.getDay();
        const diffToTarget = (current + 7 - weekdayIndex) % 7; // quantos dias atrás está o weekday desejado
        d.setDate(d.getDate() - diffToTarget - (weeksAgo * 7));
        d.setHours(0, 0, 0, 0);
        return d;
      };

      const SEMANAS = 2;             // quantas semanas passadas considerar
      const SESSOES_POR_SEMANA = 2;  // quantos dias por semana esse treino foi feito (ex.: 2x/sem)

      for (const treino of treinos) {
        const exRes = await db.query(
          'SELECT id_exercicio, series_meta, repeticao_meta, carga_meta FROM treino_exercicios WHERE id_treino = ?;',
          [treino.id_treino]
        );
        const exercicios = exRes.values || [];
        if (!exercicios.length) continue;

        const todosDias = [1,2,3,4,5,6,0];
        const escolhidos = new Set<number>();
        while (escolhidos.size < SESSOES_POR_SEMANA) {
          const pick = todosDias[Math.floor(Math.random() * todosDias.length)];
          escolhidos.add(pick);
        }
        const diasEscolhidos = Array.from(escolhidos); 

        // Para cada semana no passado e para cada dia escolhido, gera uma sessão completa
        for (let w = 0; w < SEMANAS; w++) {
          for (const diaIdx of diasEscolhidos) {
            const dataSessao = getDateForWeekday(hoje, diaIdx, w);        // data coerente com o dia
            const diaSemanaStr = nomesDias[diaIdx];

            for (const ex of exercicios) {
              const cargaMeta = ex.carga_meta ?? 0;
              const repMeta   = ex.repeticao_meta ?? 0;
              const seriesMeta= ex.series_meta ?? 0;

              const fCarga   = 0.65 + Math.random() * 0.5;  // 65% a 115% da meta
              const fRep     = 0.80 + Math.random() * 0.4;  // 80% a 120% da meta
              const fSeries  = 0.85 + Math.random() * 0.3;  // 85% a 115% da meta

              const cargaFeita = Math.max(0, Math.round(cargaMeta * fCarga));
              const repFeita   = Math.max(1, Math.round(repMeta   * fRep));
              const seriesFeito= Math.max(1, Math.round(seriesMeta* fSeries));

              await db.run(
                `INSERT INTO historico (
                  id_treino, id_exercicio, data, dia_semana,
                  carga_feita, repeticao_feita, series_feito,
                  carga_meta, repeticao_meta, series_meta
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  treino.id_treino,
                  ex.id_exercicio,
                  dataSessao.toISOString().split('T')[0],
                  diaSemanaStr,
                  cargaFeita,
                  repFeita,
                  seriesFeito,
                  cargaMeta,
                  repMeta,
                  seriesMeta
                ]
              );
            }
          }
        }
      }

      console.log('[DB] Histórico de treinos populado.');
    } catch (err) {
      console.error('[DB] Erro ao popular histórico:', err);
    }
  }

  async populateTreinador(): Promise<void> {
  if (!this.db) throw new Error('DB não aberto');

  const insertTreinadores = `
    INSERT INTO treinador (nome, telefone, email, cidade, UF) VALUES
      ('Lucas Silva', '(11) 98877-1234', 'lucas.silva@exemplo.com', 'São Paulo', 'SP'),
      ('Mariana Oliveira', '(21) 99766-4321', 'mariana.oliveira@exemplo.com', 'Rio de Janeiro', 'RJ'),
      ('Rafael Souza', '(31) 99855-9876', 'rafael.souza@exemplo.com', 'Belo Horizonte', 'MG'),
      ('Fernanda Costa', '(41) 99644-5566', 'fernanda.costa@exemplo.com', 'Curitiba', 'PR'),
      ('Tiago Santos', '(71) 99533-7788', 'tiago.santos@exemplo.com', 'Salvador', 'BA'),
      ('Carla Pereira', '(51) 99422-6677', 'carla.pereira@exemplo.com', 'Porto Alegre', 'RS'),
      ('Pedro Gomes', '(61) 99311-4455', 'pedro.gomes@exemplo.com', 'Brasília', 'DF'),
      ('Ana Lima', '(81) 99200-8899', 'ana.lima@exemplo.com', 'Recife', 'PE'),
      ('Rodrigo Ribeiro', '(85) 99199-7788', 'rodrigo.ribeiro@exemplo.com', 'Fortaleza', 'CE'),
      ('Juliana Martins', '(48) 99088-6677', 'juliana.martins@exemplo.com', 'Florianópolis', 'SC');
  `;

  await this.db.execute(insertTreinadores);
  console.log('[DB] Tabela "treinador" populada com sucesso.');
  }




  // Retorna os nomes dos treinos
  async getTreinos(): Promise<string[]> {
    if (!this.db) throw new Error('DB não aberto');

    const result = await this.db.query('SELECT nome_treino FROM treinos WHERE ativo = 1 ORDER BY id_treino');
    return result.values?.map((row: any) => row.nome_treino) || [];
  }

  // Retorna o ID de um treino com base no nome
  async getIdTreinoByNome(nome_treino: string): Promise<number | null> {
    if (!this.db) throw new Error('DB não aberto');

    const result = await this.db.query(
      'SELECT id_treino FROM treinos WHERE nome_treino = ?',
      [nome_treino]
    );

    if (result.values && result.values.length > 0) {
      return result.values[0].id_treino;
    }

    console.warn('[DB] Nenhum treino encontrado com o nome:', nome_treino);
    return null;
  }

  // Retorna os exercícios vinculados a um treino específico
  async getExerciciosPorTreino(id_treino: number): Promise<any[]> {
    if (!this.db) throw new Error('DB não aberto');

    const query = `
      SELECT 
        e.nome_exercicio, 
        e.grupo_muscular,
        te.series_meta, 
        te.repeticao_meta, 
        te.carga_meta
      FROM treino_exercicios te
      JOIN exercicios e ON te.id_exercicio = e.id_exercicio
      WHERE te.id_treino = ?
      ORDER BY e.nome_exercicio
    `;

    const result = await this.db.query(query, [id_treino]);
    console.log('[DEBUG DB] getExerciciosPorTreino retornou:', result);
    console.log('[DEBUG DB] getExerciciosPorTreino retornou (valores):', result.values);
    console.log(JSON.stringify(result, null, 2));
    return result.values || [];
  }

  async getUltimoTreinoPorDiaSemana(diaSemana: string) {
    console.log('[DB] Buscando último treino do dia:', diaSemana);

    try {
      const db = await this.sqlite.retrieveConnection('fitcheckDB', false);

      // Obter o id_treino e a data mais recente para o dia informado
      const ultimoRes = await db.query(
        `
        SELECT 
          id_treino,
          MAX(data) AS ultima_data
        FROM historico
        WHERE LOWER(dia_semana) = LOWER(?)
        GROUP BY id_treino
        ORDER BY ultima_data DESC
        LIMIT 1;
        `,
        [diaSemana]
      );

      if (!ultimoRes.values || ultimoRes.values.length === 0) {
        console.warn('[DB] Nenhum treino encontrado para o dia:', diaSemana);
        return null;
      }

      const { id_treino, ultima_data } = ultimoRes.values[0];

      // Buscar o nome do treino na tabela "treinos"
      const treinoRes = await db.query(
        'SELECT nome_treino FROM treinos WHERE id_treino = ?;',
        [id_treino]
      );

      const nome_treino = treinoRes.values?.[0]?.nome_treino ?? 'Treino';

      // Buscar os exercícios do treino, referentes àquela data
      const exRes = await db.query(
        `
        SELECT 
          e.nome_exercicio AS nome,
          h.id_exercicio,
          h.carga_feita,
          h.repeticao_feita,
          h.series_feito,
          h.carga_meta,
          h.repeticao_meta,
          h.series_meta
        FROM historico h
        JOIN exercicios e ON e.id_exercicio = h.id_exercicio
        WHERE h.id_treino = ? AND h.data = ?;
        `,
        [id_treino, ultima_data]
      );

      const exercicios = exRes.values ?? [];

      return {
        id_treino,
        nome_treino,
        ultima_data,
        exercicios,
      };
    } catch (err) {
      console.error('[DB] Erro em getUltimoTreinoPorDiaSemana:', err);
      return null;
    }
  }

  async getExerciciosPorTreinoHistorico(id_treino: number): Promise<any[]> {
    if (!this.db) throw new Error('DB não aberto');

    const query = `
      SELECT 
        e.nome_exercicio,
        e.grupo_muscular,
        h.series_feito,
        h.series_meta,
        h.repeticao_feita,
        h.repeticao_meta,
        h.carga_feita,
        h.carga_meta,
        h.data,
        h.dia_semana
      FROM historico h
      JOIN exercicios e ON h.id_exercicio = e.id_exercicio
      WHERE h.id_treino = ?
      ORDER BY e.nome_exercicio ASC;
    `;

    const result = await this.db.query(query, [id_treino]);
    return result.values || [];
  }

  async getEvolucaoCargaPorTreino(id_treino: number) {
    if (!this.db) throw new Error('DB não aberto');

    const query = `
      SELECT 
        h.data,
        e.nome_exercicio,
        AVG(h.carga_feita) AS carga_media
      FROM historico h
      JOIN exercicios e ON e.id_exercicio  = h.id_exercicio
      WHERE h.id_treino = ?
      GROUP BY h.data, e.nome_exercicio
      ORDER BY h.data ASC;
    `;

    const result = await this.db.query(query, [id_treino]);
    return result.values || [];
  }



  
  // Adiciona um novo treino e retorna seu ID
  async addTreino(nome_treino: string): Promise<number> {
    if (!this.db) throw new Error('DB não aberto');

    const result = await this.db.run(
      `INSERT INTO treinos (nome_treino) VALUES (?)`,
      [nome_treino]
    );

    console.log('[DB] Novo treino inserido:', nome_treino);

    // Retorna o id_treino recém-criado
    const idResult = await this.db.query('SELECT last_insert_rowid() as id_treino');
    const id_treino = idResult.values?.[0]?.id_treino || null;

    console.log('[DB] ID do treino criado:', id_treino);
    return id_treino;
  }

  // Desabilita um treino
  async desabilitarTreino(id_treino: number): Promise<void> {
  if (!this.db) throw new Error('DB não aberto');

  await this.db.run(
    'UPDATE treinos SET ativo = 0 WHERE id_treino = ?',
    [id_treino]
  );

  console.log('[DB] Treino desabilitado (soft delete), ID:', id_treino);
  }
  
  // Adiciona um exercício a um treino específico
  async addExercicioAoTreino(
    id_treino: number,
    id_exercicio: number,
    series_meta: number,
    repeticao_meta: number,
    carga_meta: number
  ): Promise<void> {
    if (!this.db) throw new Error('DB não aberto');

    await this.db.run(
      `INSERT INTO treino_exercicios 
        (id_treino, id_exercicio, series_meta, repeticao_meta, carga_meta) 
      VALUES (?, ?, ?, ?, ?)`,
      [id_treino, id_exercicio, series_meta, repeticao_meta, carga_meta]
    );

    console.log(`[DB] Exercício ${id_exercicio} vinculado ao treino ${id_treino}`);
  }

  // Registra uma entrada no histórico de treinos
  async registrarHistorico(
    id_treino: number,
    id_exercicio: number,
    carga_feita: number,
    repeticao_feita: number,
    series_feito: number,
    carga_meta: number,
    repeticao_meta: number,
    series_meta: number
  ): Promise<void> {
    if (!this.db) throw new Error('DB não aberto');

    // Data e dia da semana atuais
    const data = new Date();
    const dataStr = data.toISOString().split('T')[0]; // formato YYYY-MM-DD
    const diaSemana = data.toLocaleDateString('pt-BR', { weekday: 'long' });

    await this.db.run(
      `INSERT INTO historico (
        id_treino, id_exercicio, data, dia_semana,
        carga_feita, repeticao_feita, series_feito,
        carga_meta, repeticao_meta, series_meta
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id_treino,
        id_exercicio,
        dataStr,
        diaSemana,
        carga_feita,
        repeticao_feita,
        series_feito,
        carga_meta,
        repeticao_meta,
        series_meta
      ]
    );

    console.log(`[DB] Histórico registrado para treino ${id_treino}, exercício ${id_exercicio}`);
  }


}
