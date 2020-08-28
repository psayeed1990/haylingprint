//starts code for product variable
window.onload = function () {
  if (document.getElementById('variants')) {
    let variants = JSON.parse(document.getElementById('variants').innerHTML);
    let variableForm = document.getElementById('variable-form');
    let baseName = document.getElementById('base-name');
    let price = document.querySelector('span#price');
    let SKU = document.getElementById('sku');

    let baseVariants = variants.filter((variant) => variant.base === '');

    baseVariants.forEach((variant) => {
      baseName.innerHTML = variant.name + ': ';
      variableForm.innerHTML += `<input class="base-radio" style="width: 40px; display: inline;" type="radio" name="baseVariableName" value="${variant.value}" required="true"><label style="width: 40px; display: inline;">${variant.value}</label>`;
    });

    let baseRadioClass = document.getElementsByClassName('base-radio');
    for (let i = 0; i < baseRadioClass.length; i++) {
      baseRadioClass[i].addEventListener('click', changeContent);

      function changeContent() {
        price.innerHTML = baseVariants[i].price;

        sku.value = baseVariants[i].SKU;

        let secondLevel = variants.filter(
          (variant) => variant.base === baseVariants[i].SKU
        );

        if (secondLevel.length === 0) {
          document.getElementById('secondLevel-form').style.display = 'none';
          document.getElementById('thirdLevel-form').style.display = 'none';
        }
        if (secondLevel.length > 0) {
          document.getElementById('secondLevel-form').style.display = 'block';
          document
            .getElementsByName('secondVariableName')
            .forEach((sec) => (sec.checked = false));
        }
      }
    }

    //second level
    for (let i = 0; i < baseRadioClass.length; i++) {
      let secondLevel = variants.filter(
        (variant) => variant.base === baseVariants[i].SKU
      );
      if (secondLevel.length > 0) {
        let secondLevelForm = document.getElementById('secondLevel-form');
        let secondLevelName = document.getElementById('secondLevel-name');

        secondLevel.forEach((variant) => {
          secondLevelName.innerHTML = variant.name + ': ';
          secondLevelForm.innerHTML += `<input class="second-radio" style="width: 40px; display: inline;" type="radio" name="secondVariableName" value="${variant.value}" required="true"><label style="width: 40px; display: inline;">${variant.value}</label>`;
        });

        let secondRadioClass = document.getElementsByClassName('second-radio');

        for (let j = 0; j < secondRadioClass.length; j++) {
          secondRadioClass[j].addEventListener('click', changeSecContent);

          function changeSecContent() {
            price.innerHTML = secondLevel[j].price;

            sku.value = secondLevel[j].SKU;

            let thirdLevel = variants.filter(
              (variant) => variant.base === secondLevel[j].SKU
            );

            if (thirdLevel.length === 0) {
              document.getElementById('thirdLevel-form').style.display = 'none';
            }
            if (thirdLevel.length > 0) {
              document.getElementById('thirdLevel-form').style.display =
                'block';
              document
                .getElementsByName('thirdVariableName')
                .forEach((sec) => (sec.checked = false));
            }
          }
        }
      }
    }

    //third level
    for (let i = 0; i < baseRadioClass.length; i++) {
      let secondLevel = variants.filter(
        (variant) => variant.base === baseVariants[i].SKU
      );
      if (secondLevel.length > 0) {
        let secondRadioClass = document.getElementsByClassName('second-radio');

        for (let j = 0; j < secondRadioClass.length; j++) {
          let thirdLevel = variants.filter(
            (variant) => variant.base === secondLevel[j].SKU
          );

          if (thirdLevel.length > 0) {
            let thirdLevelForm = document.getElementById('thirdLevel-form');
            let thirdLevelName = document.getElementById('thirdLevel-name');

            thirdLevel.forEach((variant) => {
              thirdLevelName.innerHTML = variant.name + ': ';
              thirdLevelForm.innerHTML += `<input class="third-radio" style="width: 40px; display: inline;" type="radio" name="thirdVariableName" value="${variant.value}" required><label style="width: 40px; display: inline;">${variant.value}</label>`;
            });

            let thirdRadioClass = document.getElementsByClassName(
              'third-radio'
            );

            for (let k = 0; k < thirdRadioClass.length; k++) {
              thirdRadioClass[k].addEventListener('click', changeThirdContent);

              function changeThirdContent() {
                price.innerHTML = thirdLevel[k].price;

                sku.value = thirdLevel[k].SKU;
              }
            }
          }
        }
      }
    }
  }
};
//ends code for product variable
