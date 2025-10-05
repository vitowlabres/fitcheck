Banco a ser desenvolvido:

Tabela para os treinos
CREATE TABLE treinos (
  id_treino INTEGER PRIMARY KEY AUTOINCREMENT,
  nome_treino TEXT NOT NULL
);

Tabela para os exercícios
CREATE TABLE IF NOT EXISTS exercicios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome_exercicio TEXT NOT NULL,
  grupo_muscular TEXT
);

Tabela que relaciona trinos e exercícios
CREATE TABLE treino_exercicios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_treino INTEGER NOT NULL,
  id_exercicio INTEGER NOT NULL,
  series_meta INTEGER,
  repeticao_meta INTEGER,
  carga_meta INTEGER,
  FOREIGN KEY (id_treino) REFERENCES treinos(id_treino) ON DELETE CASCADE,
  FOREIGN KEY (id_exercicio) REFERENCES exercicios(id_exercicio) ON DELETE CASCADE
);

Tabela com o histórico do treino
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



-------------------------- Exemplo de uso das funções getExerciciosPorTreino --------------------------

<ion-list *ngIf="exercicios.length > 0">
  <ion-item *ngFor="let ex of exercicios">
    <ion-label>
      <h2>{{ ex.nome_exercicio }}</h2>
      <p>{{ ex.grupo_muscular }} — {{ ex.series_meta }}x{{ ex.repeticao_meta }} ({{ ex.carga_meta }} kg)</p>
    </ion-label>
  </ion-item>
</ion-list>




