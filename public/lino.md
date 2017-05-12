#### Descrizione del problema

Il giornalaio Lino è un appassionato di matematica e, prima di consegnare il resto ai propri clienti, si diverte a calcolare mentalmente quante differenti possibilità esistono per consegnare tale resto. Ad esempio, considerando l'Euro come valuta, per consegnare 6 centesimi di resto esistono le seguenti 5 possibilità:
*    6 monete da un centesimo,
*    4 monete da un centesimo e 1 da due centesimi,
*    2 monete da un centesimo e 2 da due centesimi,
*    1 moneta da un centesimo e 1 da cinque centesimi,
*    3 monete da due centesimi.

Lino si sta però accorgendo che a causa della lentezza nella consegna del resto sta perdendo molti clienti. Pertanto, aiuta Lino a calcolare il numero di possibli combinazioni.
Dati di input

#### File di input

Il file input.txt contiene nella prima riga un intero positivo N che rappresenta il numero di monete diverse disponibili. La seconda riga contiene un intero positivo R che rappresenta il resto da consegnare al cliente. Ciascuna delle successive N righe contiene un intero positivo che indica il valore di ogni singolo tipo di moneta.

#### File di output
Il file output.txt è composto da una riga contenente un solo intero, che rappresenta il numero di tutte le possibili combinazioni di monete per la consegna del resto R (notare che possono essere usate più copie dello stesso tipo di moneta, per esempio 6 monete da cinque centesimi).

#### Assunzioni
*   1 < N < 100
*   1 < R < 1000
*   I valori dei vari tipi di N monete sono tutti diversi.

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
6
1
2
5
10
20
50
100
200</td>
      <td>5</td>
    </tr>
    <tr>
      <td>6
6
5
10
20
50
100
200</td>
      <td>0</td>
    </tr>
  </tbody>
</table>

#### Note
Un programma che restituisce sempre lo stesso valore, indipendentemente dai dati in input.txt, non totalizza alcun punteggio rilevante.
