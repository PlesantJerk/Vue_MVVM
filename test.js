import VM from './view_models';

class VMABC extends VM.VMBase
{
    contructor()
    {
        //super();
    }

    sayIt()
    {
        console.log('okay');
    }
}

var abc = new VMABC();
abc.sayIt();
