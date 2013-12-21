<h1>Pokbot <img src="https://travis-ci.org/sovlin/pokbot.png?branch=master" alt="Build Status" />
</h1>

J'ai refait l'architecture pour "simplifier" les choses.<br/>
Pour installer il sufi de vous metre a la racine du projet <br/>
et faire : <b><i>npm install</i></b><br>
puis pour executer : <b><i>node app.js</i></b>
<h2>Nouvelle architecture</h2>
<ul>
    <li>client
        <ul>
            <li>Vous vous demerdez pour comprendre !</li>
        </ul>
    </li>
    <li>server
        <ul>
            <li>plateau.js ( le plateau )</li>
            <li>RasendeRoboter.js ( l'intelligence du jeu si il y en a)</li>
            <li>ServeurRasendRoboter.js ( le serveur web )</li>
        </ul>
    </li>
    <li>app.js (le point d'entrer du programme) <b>commande run</b> : <i>node app.js</i></li>
    <li>package.json (descripteur du projet dépendance etc ... ) <b>commande run</b> : <i>npm install</i></li>
</ul>
