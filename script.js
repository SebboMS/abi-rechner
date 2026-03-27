window.onload = function() {
    let inputs = document.querySelectorAll('input[type="number"]');
    inputs.forEach (input => {
        input.addEventListener("input", function() {
            calculate();
        });
    });
}

function calculate() {
    document.getElementById("resultArea").style.display = 'block';
    if (validateInputs()) {
        highlightMandatoryGrades();
        const LKGrades = collectLKGrades();
        const GKGrades = collectGKGrades(LKGrades);
        const abiturGrades = collectAbiturGrades();
        displayResults(calculateTotalPoints(GKGrades, LKGrades, abiturGrades));
        highlightDeficits();
        highlightZeroGrades();
    }
}

function collectAbiturGrades() {
    var examValues = [];
    var examInputs = document.querySelectorAll('input[name$="Exam"]');
    
    examInputs.forEach(function(input) {
        var computedStyle = window.getComputedStyle(input);
        if (computedStyle.display == 'block') {
            examValues.push(parseInt(input.value));
        }
    });
    return examValues;
}

function collectLKGrades(){
    return [
        parseInt(document.getElementsByName("biologySem3")[0].value),
        parseInt(document.getElementsByName("biologySem4")[0].value),
        parseInt(document.getElementsByName("biologySem5")[0].value),
        parseInt(document.getElementsByName("biologySem6")[0].value),
        parseInt(document.getElementsByName("germanSem3")[0].value),
        parseInt(document.getElementsByName("germanSem4")[0].value),
        parseInt(document.getElementsByName("germanSem5")[0].value),
        parseInt(document.getElementsByName("germanSem6")[0].value)
    ];
}

function collectGKGrades(passedLKGrades){
    const englishGrades = [
        parseInt(document.getElementsByName("englishSem3")[0].value),
        parseInt(document.getElementsByName("englishSem4")[0].value),
        parseInt(document.getElementsByName("englishSem5")[0].value),
        parseInt(document.getElementsByName("englishSem6")[0].value)
    ];
    const mathGrades = [
        parseInt(document.getElementsByName("mathSem3")[0].value),
        parseInt(document.getElementsByName("mathSem4")[0].value),
        parseInt(document.getElementsByName("mathSem5")[0].value),
        parseInt(document.getElementsByName("mathSem6")[0].value)
    ];
 
    let selectedGKGrades = [];
    let otherGKGrades = [];

    selectedGKGrades = [
        parseInt(document.getElementsByName("historySem3")[0].value),
        parseInt(document.getElementsByName("historySem4")[0].value),
        parseInt(document.getElementsByName("historySem5")[0].value),
        parseInt(document.getElementsByName("historySem6")[0].value)
    ];
    otherGKGrades = [
        parseInt(document.getElementsByName("otherSem3")[0].value),
        parseInt(document.getElementsByName("otherSem4")[0].value),
        parseInt(document.getElementsByName("otherSem5")[0].value),
        parseInt(document.getElementsByName("otherSem6")[0].value)         
    ];
    setBackgroundColor([
        document.getElementsByName("historySem3")[0],
        document.getElementsByName("historySem4")[0],
        document.getElementsByName("historySem5")[0],
        document.getElementsByName("historySem6")[0],
    ], "yellow");

    const currentAvg = (((passedLKGrades.reduce((total, current) => total + current * 2, 0)) + (mathGrades.reduce((total, current) => total + current, 0)) + (englishGrades.reduce((total, current) => total + current, 0)) + (selectedGKGrades.reduce((total, current) => total + current, 0))) / 28);
    let allGKGrades = (englishGrades.concat(mathGrades, selectedGKGrades));

    if (((checkGKDeficits(allGKGrades)) + (checkLKDeficits(passedLKGrades))) >= 5) {
        //Wenn fünf (oder mehr) Defizite vorliegen, gehen alle Noten in die Bewertung ein.
        for (var j = 0; j < otherGKGrades.length; j++) {
            allGKGrades.push(otherGKGrades[j]);
            document.getElementsByName("otherSem" + (j+3).toString())[0].style.backgroundColor = "yellow";
        }
    } else {
        //Im anderen Fall gehen nur die Noten ein, die besser sind als der Schnitt.
        for (var i = 0; i < otherGKGrades.length; i++) {
            if (otherGKGrades[i] > currentAvg) {
                allGKGrades.push(otherGKGrades[i]);
                document.getElementsByName("otherSem" + (i+3).toString())[0].style.backgroundColor = "yellow";
            }
        }    
    }
    return allGKGrades;
}

function calculateTotalPoints(passedGKGrades, passedLKGrades, passedAbiturGrades){
    var deficitsGK = checkGKDeficits(passedGKGrades);
    var deficitsLK = checkLKDeficits(passedLKGrades);
    //console.log("Defizite GK: " +  deficitsGK + " / Defizite LK: " + deficitsLK);
    if ((deficitsGK + deficitsLK) > 5) {
        return "Du hast in den einzubringenden Kursen insgesamt mehr als <span class='highlight'>fünf Defizite</span>. Damit wärst du nicht zur Abiturprüfung zugelassen.";
    } else if (deficitsLK > 3) {
        return "Du hast im Leistungskursbereich mehr als <span class='highlight'>drei Defizite</span>. Damit wärst du nicht zur Abiturprüfung zugelassen.";
    } else {
        const pointsLK = 2 * passedLKGrades.reduce((acc, curr) => acc + curr, 0);
        const pointsGK = passedGKGrades.reduce((acc, curr) => acc + curr, 0);
        const pointsBlockI = Math.round(((pointsLK + pointsGK) / ((2 * passedLKGrades.length) + passedGKGrades.length)) * 40);
        if ((pointsBlockI) < 200) {
            return "Du hast in den einzubringenden Kursen weniger als <span class='highlight'>200 Punkte</span> erreicht. Damit wärst du nicht zur Abiturprüfung zugelassen.";
        } else {
            const pointsBlockII = 5 * passedAbiturGrades.reduce((acc, curr) => acc + curr, 0);
            if (pointsBlockII < 100) {
                return "Du hast in den Abiturprüfungen mit <span class='highlight'>" + pointsBlockII + " Punkten</span> weniger als <span class='red-letter'>100 Punkte</span> erreicht. Damit hättest du die Abiturprüfung nicht bestanden. Mündliche Nachprüfungen sind ggf. möglich."
            } else if (checkAbiGKDeficits(passedAbiturGrades) >= 2) {
                return "Du hast in den Grundkursen im Abiturbereich <span class='highlight'>" + checkAbiGKDeficits(passedAbiturGrades) + " Defizite</span>. Damit hättest du die Abiturprüfung nicht bestanden. Mündliche Nachprüfungen sind ggf. möglich."
            } else if (checkAbiLKDeficits(passedAbiturGrades) >= 2) {
                return "Du hast in den Leistungskursen im Abiturbereich <span class='highlight'>" + checkAbiLKDeficits(passedAbiturGrades) + " Defizite</span>. Damit hättest du die Abiturprüfung nicht bestanden. Mündliche Nachprüfungen sind ggf. möglich."
            } else {
                const totalPoints = pointsBlockI + pointsBlockII;
                const avgAbitur = 5.67 - (totalPoints / 180);
                if (avgAbitur < 1) {
                    avgAbitur = 1.0;
                }
                return "Du hast die Abiturprüfung mit einem <span class='highlight'>Schnitt</span> von <span class='red-letter'>" + avgAbitur.toFixed(1) + "</span> bestanden.";
            }
        }
    }
}

function displayResults(resultLine){
    const resultArea = document.getElementById('resultArea');
    resultArea.innerHTML = resultLine;
}

function checkLKDeficits(passedLKGrades, passedGKGrades) {
    var deficitsLK = 0;
    for (var i = 0; i < passedLKGrades.length; i++) {
        if (passedLKGrades[i] <= 4) {
            deficitsLK++;
        }
    }
    return deficitsLK;
}

function checkGKDeficits(passedGKGrades) {
    var deficitsGK = 0;
    for (var i = 0; i < passedGKGrades.length; i++) {
        if (passedGKGrades[i] <= 4) {
            deficitsGK++;
        }
    }
    return deficitsGK;
}

function checkAbiLKDeficits(passedAbiturGrades) {
    var deficitsLKAbitur = 0;
    for (var i = 0; i < (passedAbiturGrades.length - 2); i++) {
        if (passedAbiturGrades[i] <= 4) {
            deficitsLKAbitur++;
        }
    }
    return deficitsLKAbitur;
}

function checkAbiGKDeficits(passedAbiturGrades) {
    var deficitsGKAbitur = 0;
    for (var i = 2; i < (passedAbiturGrades.length); i++) {
        if (passedAbiturGrades[i] <= 4) {
            deficitsGKAbitur++;
        }
    }
    return deficitsGKAbitur;
}

function highlightMandatoryGrades(){
    setBackgroundColor(document.querySelectorAll('input[type="number"]'), 'white');
    setBackgroundColor([
        document.getElementsByName("englishSem3")[0],
        document.getElementsByName("englishSem4")[0],
        document.getElementsByName("englishSem5")[0],
        document.getElementsByName("englishSem6")[0],
        document.getElementsByName("mathSem3")[0],
        document.getElementsByName("mathSem4")[0],
        document.getElementsByName("mathSem5")[0],
        document.getElementsByName("mathSem6")[0],
        document.getElementsByName("biologySem3")[0],
        document.getElementsByName("biologySem4")[0],
        document.getElementsByName("biologySem5")[0],
        document.getElementsByName("biologySem6")[0],
        document.getElementsByName("germanSem3")[0],
        document.getElementsByName("germanSem4")[0],
        document.getElementsByName("germanSem5")[0],
        document.getElementsByName("germanSem6")[0],
        document.getElementsByName("germanExam")[0],
        document.getElementsByName("biologyExam")[0],
        document.getElementsByName("englishExam")[0],
        document.getElementsByName("mathExam")[0],
        document.getElementsByName("historyExam")[0],
    ], "yellow");
}

function setBackgroundColor(elements, color) {
    elements.forEach(element => {
        element.style.backgroundColor = color;
    });
}

function resetForm() {
    document.getElementById("resultArea").style.display = 'none';

    // Zugriff auf das gesamte Formular
    const form = document.getElementById('gradeForm');
    
    // Setze alle Eingabefelder zurück
    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => {
        if (input.type === 'number') {
            input.value = '';  // Leere alle Textfelder
            // Verstecke Prüfungsnoten-Felder, die zu group1 oder group2 gehören
            if (input.dataset.group === 'group1' || input.dataset.group === 'group2' || input.dataset.group === 'group3') {
                input.style.display = 'none';  // Verstecke diese spezifischen Felder
            } else {
                input.style.display = 'block';  // Stelle sicher, dass andere Felder sichtbar bleiben
            }
        } else if (input.type === 'checkbox') {
            input.checked = false;  // Deaktiviere alle Checkboxen
        }
        input.style.backgroundColor = "white";
    });

    // Lösche alle Fehlermeldungen
    const resultArea = document.getElementById('resultArea');
    resultArea.innerHTML = "Hier werden später die <span class='highlight'>Ergebnisse<span> angezeigt.";
}

function validateInputs() {
    const inputs = document.querySelectorAll('input[type="number"]');
    let allValid = true;
    let errorMessage = '';

    // Überprüfe Eingabefelder
    inputs.forEach(input => {
        if (input.style.display !== 'none' && (input.value === '' || input.value < 0 || input.value > 15)) {
            allValid = false;
            errorMessage = "Bitte gib für alle <span class='highlight'>sichtbaren Felder</span> Noten zwischen 0 und 15 ein.";
        } 
    });

    // Überprüfe Checkboxen für Gruppe 1
    const group1Checked = Array.from(document.querySelectorAll('input[type="checkbox"][data-group="group1"]'))
                                .some(checkbox => checkbox.checked);
    // Überprüfe Checkboxen für Gruppe 2
    const group2Checked = Array.from(document.querySelectorAll('input[type="checkbox"][data-group="group2"]'))
                                .some(checkbox => checkbox.checked);

    // Generiere Fehlermeldungen basierend auf Checkbox-Prüfungen
    if (!group1Checked) {
        allValid = false;
        errorMessage += ' Du hast kein <span class="highlight">drittes bzw. viertes Abiturfach</span> ausgewählt.';
    }

    // Zeige Fehlermeldungen oder Bestätigung an
    const resultArea = document.getElementById('resultArea');
    if (!allValid) {
        resultArea.innerHTML = errorMessage;
        return
    }

    return allValid;
}


document.addEventListener('DOMContentLoaded', function() {
    var checkboxes = document.querySelectorAll('input[type="checkbox"][data-group]');
    checkboxes.forEach(function(checkbox) {
        checkbox.addEventListener('change', handleCheckboxChange);
    });
});

function handleCheckboxChange() {
    var checkbox = this;
    var targetId = checkbox.dataset.target;
    var targetElement = document.getElementById(targetId);

    if (checkbox.checked) {
        // Zeige das entsprechende Prüfungsfeld
        if (targetElement) {
            targetElement.style.display = 'block';
        }
        // Deaktiviere und verstecke alle anderen in der gleichen Gruppe
        var group = checkbox.dataset.group;
        var allCheckboxes = document.querySelectorAll('input[type="checkbox"][data-group="' + group + '"]');
        allCheckboxes.forEach(function(other) {
            if (other !== checkbox) {
                other.checked = false;
                var otherTargetId = other.dataset.target;
                var otherTargetElement = document.getElementById(otherTargetId);
                if (otherTargetElement) {
                    otherTargetElement.style.display = 'none';
                }
            }
        });
    } else {
        // Verstecke das Prüfungsfeld, wenn die Checkbox deaktiviert wird
        if (targetElement) {
            targetElement.style.display = 'none';
        }
    }
}

function highlightDeficits() {
    var inputs = document.querySelectorAll('input[type="number"]');

    inputs.forEach(input => {
        var value = parseInt(input.value);
        //Falls die Note zwischen 1 und 4 liegt, wird das Eingabefeld orange eingefärbt
        if (value >= 0 && value <= 4) {
            input.style.backgroundColor = "#ffcc80";
        }
    });
}

/*function highlightZeroGrades() {
    let semesters = ["Sem3", "Sem4", "Sem5", "Sem6"];

    let inputs = document.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.style.backgroundColor = "white";
    });
    
    semesters.forEach(semester => {
        let inputs = document.querySelectorAll(`input[name$="${semester}"]`);
        inputs.forEach(input => {
            let value = parseInt(input.value);
            if (value === 0) {
                input.style.backgroundColor = "#ff9999";
                let resultArea = document.getElementById("resultArea");
                resultArea.innerHTML = "Mindestens <span class='highlight'>ein Kurs</span> wurde mit <span class='highlight'>0 Punkten</span> abgeschlossen. Damit wäre eine Zulassung zur Abiturprüfung <span class='highlight'>nicht möglich.</span>";
            }
        });
    });  
}*/

function highlightZeroGrades() {
    let semesters = ["Sem3", "Sem4", "Sem5", "Sem6"];
    let hasZero = false;

    // Überprüfe, ob irgendwo eine 0 vorkommt
    semesters.forEach(semester => {
        let inputs = document.querySelectorAll(`input[name$="${semester}"]`);
        inputs.forEach(input => {
            let value = parseInt(input.value);
            if (value === 0) {
                hasZero = true;
            }
        });
    });

    if (hasZero) {
        // Wenn es eine 0 gibt, setze alle Eingabefelder auf weiß zurück
        let inputs = document.querySelectorAll('input[type="number"]');
        inputs.forEach(input => {
            input.style.backgroundColor = "white";
        });

        // Markiere nur die Felder mit 0 Punkten rot
        semesters.forEach(semester => {
            let inputs = document.querySelectorAll(`input[name$="${semester}"]`);
            inputs.forEach(input => {
                let value = parseInt(input.value);
                if (value === 0) {
                    input.style.backgroundColor = "#ff9999";
                }
            });
        });

        let resultArea = document.getElementById("resultArea");
        resultArea.innerHTML = "Mindestens <span class='highlight'>ein Kurs</span> wurde mit <span class='highlight'>0 Punkten</span> abgeschlossen. Damit wäre eine Zulassung zur Abiturprüfung <span class='highlight'>nicht möglich.</span>";
    }
}
