#### Descrizione del problema

Il dottore ordina a Poldo di seguire una dieta. Ad ogni pasto non può mai mangiare un panino che abbia
un peso maggiore o uguale a quello appena mangiato. Quando Poldo passeggia per la via del suo paese, da
ogni ristorante esce un cameriere proponendo il menù del giorno. Ciascun menù è composto da una serie di
panini, che verranno serviti in un ordine ben definito, e dal peso di ciascun panino. Poldo, per non violare
la regola della sua dieta, una volta scelto un menù, può decidere di mangiare o rifiutare un panino; se lo
rifiuta il cameriere gli servirà il successivo e quello rifiutato non gli sarà più servito.

Si deve scrivere un programma che permetta a Poldo, leggendo un menù, di capire qual è il numero
massimo di panini che può mangiare per quel menù senza violare la regola della sua dieta.
Riassumendo, Poldo può mangiare un panino se e solo se soddisfa una delle due condizioni:
* Il panino è il primo che mangia in un determinato pasto;
* Il panino non ha un peso maggiore o uguale all’ultimo panino che ha mangiato in un determinato
pasto.

#### File di input

Il programma deve leggere da un file di nome input.txt. Nella prima è presente un intero N, il numero
di panini nel menu. Le successive N righe contengono il peso in grammi p del panino che verrà servito. I
panini vengono serviti nell’ordine presentato.

#### File di output

Il programma deve scrivere in un file di nome output.txt. Deve venire stampato un unico intero, il
numero massimo di panini che Poldo può mangiare.

#### Assunzioni
* 1 ≤ N ≤ 10 000
* 0 ≤ p < 10 000

#### Subtask

* **Subtask 1 [ 5 punti]**: casi di esempio.
* **Subtask 2 [30 punti]**: N ≤ 100.
* **Subtask 3 [25 punti]**: N ≤ 1000.
* **Subtask 4 [25 punti]**: N ≤ 3000.
* **Subtask 5 [15 punti]**: nessuna limitazione specifica.

#### Esempio di input/output

<table class="table table-bordered sample-case">
  <thead class="thead-default">
    <tr>
      <th>input.txt</th>
      <th>output.txt</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>8
0
9
8
5
1
8
4
7</td>
      <td>4</td>
    </tr>
    <tr>
      <td>5
3
6
7
5
3</td>
      <td>3</td>
    </tr>
  </tbody>
</table>

#### Note
Nel primo esempio, Poldo può mangiare i panini 6, 5, 3. Nel secondo esempio Poldo può mangiare i
panini 9, 8, 5, 4 rispettando la sua dieta.
