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
        nome_treino TEXT NOT NULL
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

    await this.db.execute(createExercicios);
    await this.db.execute(createTreinos);
    await this.db.execute(crateTreino_exercicios);
    await this.db.execute(createHistorico);
    console.log('[DB] Tabelas criadas ou já existiam');
  }

  // Popula a tabela exercicios
  private async populateExercicios(): Promise<void> {
    if (!this.db) throw new Error('DB não aberto');

    const count = await this.db.query('SELECT COUNT(*) as total FROM exercicios');
    if (count.values && count.values[0].total > 0) {
      console.log('[DB] Tabela de exercícios já populada');
      return;
    }

    const exercicios = [
      { nome: 'cadeira extensora', grupo: 'Quadríceps' },
      { nome: 'agachamento livre', grupo: 'Posterior de coxa' },
      { nome: 'leg press', grupo: 'Quadríceps' },
      { nome: 'hack machine', grupo: 'Quadríceps' },
      { nome: 'mesa flexora', grupo: 'Posterior de coxa' },
      { nome: 'bulgaro', grupo: 'Glúteos' },
      { nome: 'remada baixa', grupo: 'Dorsal' },
      { nome: 'barra fixa', grupo: 'Dorsal' },
      { nome: 'serrote', grupo: 'Dorsal' },
      { nome: 'remada curvada', grupo: 'Trapézio médio' },
      { nome: 'puxada neutra', grupo: 'Dorsal' },
      { nome: 'elevacao lateral', grupo: 'Deltoide lateral' },
      { nome: 'desenvolvimento', grupo: 'Deltoide anterior' },
      { nome: 'elevacao frontal', grupo: 'Deltoide anterior' },
      { nome: 'crucifixo inverso', grupo: 'Deltoide posterior' },
      { nome: 'cross polia baixa', grupo: 'Peitoral inferior' },
      { nome: 'supino', grupo: 'Peitoral maior' },
      { nome: 'supino h inclinado', grupo: 'Peitoral superior' },
      { nome: 'push up', grupo: 'Peitoral maior' },
      { nome: 'triceps corda', grupo: 'Tríceps braquial' },
      { nome: 'triceps testa', grupo: 'Tríceps braquial' },
      { nome: 'rosca alternada', grupo: 'Bíceps braquial' },
      { nome: 'martelo', grupo: 'Braquiorradial' },
      { nome: 'abdominal máquina', grupo: 'Reto abdominal' }
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

    console.log('[DB] Inserindo treinos e vínculos...');

    //Inserir os treinos principais
    const treinos = ['leg day', 'costas', 'ombro', 'peito', 'braco'];
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
  
  // Retorna os nomes dos treinos
  async getTreinos(): Promise<string[]> {
    if (!this.db) throw new Error('DB não aberto');

    const result = await this.db.query('SELECT nome_treino FROM treinos ORDER BY id_treino');
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

